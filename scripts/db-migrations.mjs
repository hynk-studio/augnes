import proposalScoringSchema from "../lib/db/proposal-scoring-schema.json" with { type: "json" };

export const proposalScoringColumns = proposalScoringSchema.columns;
export const proposalScoringIndexes = proposalScoringSchema.indexes;
export const mailboxCoordinationEventTypes = [
  "mailbox_message_created",
  "mailbox_message_delivered",
  "mailbox_message_acknowledged",
  "mailbox_message_reviewed",
  "mailbox_message_superseded",
  "mailbox_message_expired",
];

export const sessionBindingColumns = [
  {
    name: "surface",
    definition:
      "TEXT CHECK (surface IS NULL OR surface IN ('chatgpt', 'codex', 'cockpit', 'browser', 'github', 'local_runtime', 'other'))",
  },
  { name: "actor", definition: "TEXT" },
  { name: "related_work_id", definition: "TEXT" },
  { name: "related_pr", definition: "TEXT" },
  { name: "summary", definition: "TEXT" },
  { name: "handoff_ref", definition: "TEXT" },
  { name: "evidence_pack_ref", definition: "TEXT" },
];

export const sessionBindingIndexes = [
  {
    name: "idx_sessions_scope_surface_time",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_sessions_scope_surface_time
        ON sessions(scope, surface, started_at DESC)
    `,
  },
  {
    name: "idx_sessions_scope_work_time",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_sessions_scope_work_time
        ON sessions(scope, related_work_id, started_at DESC)
    `,
  },
  {
    name: "idx_sessions_scope_pr_time",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_sessions_scope_pr_time
        ON sessions(scope, related_pr, started_at DESC)
    `,
  },
];

export function migrateSessionBindingColumns(db) {
  const table = db
    .prepare(
      `
        SELECT name
        FROM sqlite_master
        WHERE type = 'table' AND name = 'sessions'
      `,
    )
    .get();

  if (!table) {
    return {
      table_found: false,
      added_columns: [],
      created_indexes: [],
    };
  }

  const existingColumns = new Set(
    db
      .prepare("PRAGMA table_info(sessions)")
      .all()
      .map((column) => column.name),
  );
  const addedColumns = [];

  for (const { name, definition } of sessionBindingColumns) {
    if (!existingColumns.has(name)) {
      db.prepare(`ALTER TABLE sessions ADD COLUMN ${name} ${definition}`).run();
      addedColumns.push(name);
    }
  }

  const existingIndexes = new Set(
    db
      .prepare(
        `
          SELECT name
          FROM sqlite_master
          WHERE type = 'index'
            AND tbl_name = 'sessions'
        `,
      )
      .all()
      .map((index) => index.name),
  );
  const createdIndexes = [];

  for (const { name, sql } of sessionBindingIndexes) {
    if (!existingIndexes.has(name)) {
      db.prepare(sql).run();
      createdIndexes.push(name);
    }
  }

  return {
    table_found: true,
    added_columns: addedColumns,
    created_indexes: createdIndexes,
  };
}

export function migrateStateDeltaProposalScoring(db) {
  const table = db
    .prepare(
      `
        SELECT name
        FROM sqlite_master
        WHERE type = 'table' AND name = 'state_delta_proposals'
      `,
    )
    .get();

  if (!table) {
    return {
      table_found: false,
      added_columns: [],
      created_indexes: [],
    };
  }

  const existingColumns = new Set(
    db
      .prepare("PRAGMA table_info(state_delta_proposals)")
      .all()
      .map((column) => column.name),
  );
  const addedColumns = [];

  for (const { name, definition } of proposalScoringColumns) {
    if (!existingColumns.has(name)) {
      db.prepare(
        `ALTER TABLE state_delta_proposals ADD COLUMN ${name} ${definition}`,
      ).run();
      addedColumns.push(name);
    }
  }

  const existingIndexes = new Set(
    db
      .prepare(
        `
          SELECT name
          FROM sqlite_master
          WHERE type = 'index'
            AND tbl_name = 'state_delta_proposals'
        `,
      )
      .all()
      .map((index) => index.name),
  );
  const createdIndexes = [];

  for (const { name, sql } of proposalScoringIndexes) {
    if (!existingIndexes.has(name)) {
      db.prepare(sql).run();
      createdIndexes.push(name);
    }
  }

  return {
    table_found: true,
    added_columns: addedColumns,
    created_indexes: createdIndexes,
  };
}

export const deliveryExternalArtifactColumns = [
  { name: "external_artifact_id", definition: "TEXT" },
  { name: "external_artifact_url", definition: "TEXT" },
  { name: "external_artifact_type", definition: "TEXT" },
];

export function migrateDeliveryExternalArtifacts(db) {
  const table = db
    .prepare(
      `
        SELECT name
        FROM sqlite_master
        WHERE type = 'table' AND name = 'delivery_ledger'
      `,
    )
    .get();

  if (!table) {
    return {
      table_found: false,
      added_columns: [],
    };
  }

  const existingColumns = new Set(
    db
      .prepare("PRAGMA table_info(delivery_ledger)")
      .all()
      .map((column) => column.name),
  );
  const addedColumns = [];

  for (const { name, definition } of deliveryExternalArtifactColumns) {
    if (!existingColumns.has(name)) {
      db.prepare(`ALTER TABLE delivery_ledger ADD COLUMN ${name} ${definition}`).run();
      addedColumns.push(name);
    }
  }

  return {
    table_found: true,
    added_columns: addedColumns,
  };
}

export const verificationEvidenceRecordsTableSql = `
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
  )
`;

export const verificationEvidenceRecordsIndexes = [
  {
    name: "idx_verification_evidence_scope_time",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_verification_evidence_scope_time
        ON verification_evidence_records(scope, created_at DESC)
    `,
  },
  {
    name: "idx_verification_evidence_scope_work_time",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_verification_evidence_scope_work_time
        ON verification_evidence_records(scope, work_id, created_at DESC)
    `,
  },
  {
    name: "idx_verification_evidence_scope_publication_time",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_verification_evidence_scope_publication_time
        ON verification_evidence_records(scope, publication_id, created_at DESC)
    `,
  },
  {
    name: "idx_verification_evidence_scope_delivery_time",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_verification_evidence_scope_delivery_time
        ON verification_evidence_records(scope, delivery_id, created_at DESC)
    `,
  },
  {
    name: "idx_verification_evidence_scope_target_time",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_verification_evidence_scope_target_time
        ON verification_evidence_records(scope, target_surface, target_ref, created_at DESC)
    `,
  },
  {
    name: "idx_verification_evidence_scope_kind_time",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_verification_evidence_scope_kind_time
        ON verification_evidence_records(scope, evidence_kind, created_at DESC)
    `,
  },
];

export function migrateVerificationEvidenceRecords(db) {
  const existingTable = db
    .prepare(
      `
        SELECT name
        FROM sqlite_master
        WHERE type = 'table' AND name = 'verification_evidence_records'
      `,
    )
    .get();
  const createdTable = !existingTable;

  db.prepare(verificationEvidenceRecordsTableSql).run();

  const existingIndexes = new Set(
    db
      .prepare(
        `
          SELECT name
          FROM sqlite_master
          WHERE type = 'index'
            AND tbl_name = 'verification_evidence_records'
        `,
      )
      .all()
      .map((index) => index.name),
  );
  const createdIndexes = [];

  for (const { name, sql } of verificationEvidenceRecordsIndexes) {
    if (!existingIndexes.has(name)) {
      db.prepare(sql).run();
      createdIndexes.push(name);
    }
  }

  return {
    table_found: true,
    created_table: createdTable,
    created_indexes: createdIndexes,
  };
}

export const temporalPreviewReviewArtifactsTableSql = `
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
  )
`;

export const temporalPreviewReviewArtifactsIndexes = [
  {
    name: "idx_temporal_review_artifacts_scope_work_time",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_temporal_review_artifacts_scope_work_time
        ON temporal_preview_review_artifacts(scope, work_id, created_at DESC)
    `,
  },
  {
    name: "idx_temporal_review_artifacts_scope_generator_time",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_temporal_review_artifacts_scope_generator_time
        ON temporal_preview_review_artifacts(scope, generator, created_at DESC)
    `,
  },
  {
    name: "idx_temporal_review_artifacts_scope_verdict_time",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_temporal_review_artifacts_scope_verdict_time
        ON temporal_preview_review_artifacts(scope, reviewer_verdict, created_at DESC)
    `,
  },
  {
    name: "idx_temporal_review_artifacts_scope_guardrail_time",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_temporal_review_artifacts_scope_guardrail_time
        ON temporal_preview_review_artifacts(scope, guardrail_passed, created_at DESC)
    `,
  },
  {
    name: "idx_temporal_review_artifacts_scope_session_time",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_temporal_review_artifacts_scope_session_time
        ON temporal_preview_review_artifacts(scope, linked_session_id, created_at DESC)
    `,
  },
  {
    name: "idx_temporal_review_artifacts_scope_pr_time",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_temporal_review_artifacts_scope_pr_time
        ON temporal_preview_review_artifacts(scope, linked_pr_url, created_at DESC)
    `,
  },
];

export function migrateTemporalPreviewReviewArtifacts(db) {
  const existingTable = db
    .prepare(
      `
        SELECT name
        FROM sqlite_master
        WHERE type = 'table' AND name = 'temporal_preview_review_artifacts'
      `,
    )
    .get();
  const createdTable = !existingTable;

  db.prepare(temporalPreviewReviewArtifactsTableSql).run();

  const existingIndexes = new Set(
    db
      .prepare(
        `
          SELECT name
          FROM sqlite_master
          WHERE type = 'index'
            AND tbl_name = 'temporal_preview_review_artifacts'
        `,
      )
      .all()
      .map((index) => index.name),
  );
  const createdIndexes = [];

  for (const { name, sql } of temporalPreviewReviewArtifactsIndexes) {
    if (!existingIndexes.has(name)) {
      db.prepare(sql).run();
      createdIndexes.push(name);
    }
  }

  return {
    table_found: true,
    created_table: createdTable,
    created_indexes: createdIndexes,
  };
}

export const temporalPreviewReviewArtifactIdempotencyTableSql = `
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
  )
`;

export const temporalPreviewReviewArtifactIdempotencyIndexes = [
  {
    name: "idx_temporal_review_artifact_idem_scope_source_hash",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_temporal_review_artifact_idem_scope_source_hash
        ON temporal_preview_review_artifact_idempotency(scope, work_id, source_ref, preview_hash)
    `,
  },
  {
    name: "idx_temporal_review_artifact_idem_scope_artifact",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_temporal_review_artifact_idem_scope_artifact
        ON temporal_preview_review_artifact_idempotency(scope, artifact_id)
    `,
  },
];

export function migrateTemporalPreviewReviewArtifactIdempotency(db) {
  const existingTable = db
    .prepare(
      `
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name = 'temporal_preview_review_artifact_idempotency'
      `,
    )
    .get();
  const createdTable = !existingTable;

  db.prepare(temporalPreviewReviewArtifactIdempotencyTableSql).run();

  const existingIndexes = new Set(
    db
      .prepare(
        `
          SELECT name
          FROM sqlite_master
          WHERE type = 'index'
            AND tbl_name = 'temporal_preview_review_artifact_idempotency'
        `,
      )
      .all()
      .map((index) => index.name),
  );
  const createdIndexes = [];

  for (const { name, sql } of temporalPreviewReviewArtifactIdempotencyIndexes) {
    if (!existingIndexes.has(name)) {
      db.prepare(sql).run();
      createdIndexes.push(name);
    }
  }

  return {
    table_found: true,
    created_table: createdTable,
    created_indexes: createdIndexes,
  };
}

export const researchCandidateManualNotePreviewDraftsTableSql = `
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
  )
`;

export const researchCandidateManualNotePreviewDraftsIndexes = [
  {
    name: "idx_research_candidate_manual_note_preview_drafts_scope_time",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_note_preview_drafts_scope_time
        ON research_candidate_manual_note_preview_drafts(scope, created_at DESC)
    `,
  },
  {
    name: "idx_research_candidate_manual_note_preview_drafts_status_time",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_note_preview_drafts_status_time
        ON research_candidate_manual_note_preview_drafts(status, created_at DESC)
    `,
  },
  {
    name: "idx_research_candidate_manual_note_preview_drafts_input",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_note_preview_drafts_input
        ON research_candidate_manual_note_preview_drafts(input_fingerprint)
    `,
  },
  {
    name: "idx_research_candidate_manual_note_preview_drafts_source",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_note_preview_drafts_source
        ON research_candidate_manual_note_preview_drafts(source_kind, created_at DESC)
    `,
  },
];

export const researchCandidateManualNotePreviewDraftDiscardsTableSql = `
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
  )
`;

export const researchCandidateManualNotePreviewDraftDiscardsIndexes = [
  {
    name: "idx_research_candidate_manual_note_preview_draft_discards_scope_time",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_note_preview_draft_discards_scope_time
        ON research_candidate_manual_note_preview_draft_discards(scope, discarded_at DESC)
    `,
  },
];

export const researchCandidateManualNotePreviewDraftActivitiesTableSql = `
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
  )
`;

export const researchCandidateManualNotePreviewDraftActivitiesIndexes = [
  {
    name: "idx_research_candidate_manual_note_preview_draft_activities_draft_time",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_note_preview_draft_activities_draft_time
        ON research_candidate_manual_note_preview_draft_activities(preview_draft_id, activity_at DESC)
    `,
  },
  {
    name: "idx_research_candidate_manual_note_preview_draft_activities_scope_time",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_note_preview_draft_activities_scope_time
        ON research_candidate_manual_note_preview_draft_activities(scope, activity_at DESC)
    `,
  },
  {
    name: "idx_research_candidate_manual_note_preview_draft_activities_type_time",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_note_preview_draft_activities_type_time
        ON research_candidate_manual_note_preview_draft_activities(activity_type, activity_at DESC)
    `,
  },
];

export function migrateResearchCandidateManualNotePreviewDrafts(db) {
  const existingTable = db
    .prepare(
      `
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name = 'research_candidate_manual_note_preview_drafts'
      `,
    )
    .get();
  const createdTable = !existingTable;

  db.prepare(researchCandidateManualNotePreviewDraftsTableSql).run();

  const existingIndexes = new Set(
    db
      .prepare(
        `
          SELECT name
          FROM sqlite_master
          WHERE type = 'index'
            AND tbl_name = 'research_candidate_manual_note_preview_drafts'
        `,
      )
      .all()
      .map((index) => index.name),
  );
  const createdIndexes = [];

  for (const { name, sql } of researchCandidateManualNotePreviewDraftsIndexes) {
    if (!existingIndexes.has(name)) {
      db.prepare(sql).run();
      createdIndexes.push(name);
    }
  }

  return {
    table_found: true,
    created_table: createdTable,
    created_indexes: createdIndexes,
  };
}

export function migrateResearchCandidateManualNotePreviewDraftDiscards(db) {
  const existingTable = db
    .prepare(
      `
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name = 'research_candidate_manual_note_preview_draft_discards'
      `,
    )
    .get();
  const createdTable = !existingTable;

  db.prepare(researchCandidateManualNotePreviewDraftDiscardsTableSql).run();

  const existingIndexes = new Set(
    db
      .prepare(
        `
          SELECT name
          FROM sqlite_master
          WHERE type = 'index'
            AND tbl_name = 'research_candidate_manual_note_preview_draft_discards'
        `,
      )
      .all()
      .map((index) => index.name),
  );
  const createdIndexes = [];

  for (const { name, sql } of researchCandidateManualNotePreviewDraftDiscardsIndexes) {
    if (!existingIndexes.has(name)) {
      db.prepare(sql).run();
      createdIndexes.push(name);
    }
  }

  return {
    table_found: true,
    created_table: createdTable,
    created_indexes: createdIndexes,
  };
}

export function migrateResearchCandidateManualNotePreviewDraftActivities(db) {
  const existingTable = db
    .prepare(
      `
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name = 'research_candidate_manual_note_preview_draft_activities'
      `,
    )
    .get();
  const createdTable = !existingTable;

  db.prepare(researchCandidateManualNotePreviewDraftActivitiesTableSql).run();

  const existingIndexes = new Set(
    db
      .prepare(
        `
          SELECT name
          FROM sqlite_master
          WHERE type = 'index'
            AND tbl_name = 'research_candidate_manual_note_preview_draft_activities'
        `,
      )
      .all()
      .map((index) => index.name),
  );
  const createdIndexes = [];

  for (const { name, sql } of researchCandidateManualNotePreviewDraftActivitiesIndexes) {
    if (!existingIndexes.has(name)) {
      db.prepare(sql).run();
      createdIndexes.push(name);
    }
  }

  return {
    table_found: true,
    created_table: createdTable,
    created_indexes: createdIndexes,
  };
}

export const researchCandidateManualResultWriteReceiptsTableSql = `
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
  )
`;

export const researchCandidateManualResultWriteReceiptsIndexes = [
  {
    name: "idx_research_candidate_manual_result_receipts_scope_time",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_result_receipts_scope_time
        ON research_candidate_manual_result_write_receipts(scope, created_at DESC)
    `,
  },
  {
    name: "idx_research_candidate_manual_result_receipts_seed",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_result_receipts_seed
        ON research_candidate_manual_result_write_receipts(source_handoff_seed_fingerprint, created_at DESC)
    `,
  },
  {
    name: "idx_research_candidate_manual_result_receipts_status",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_result_receipts_status
        ON research_candidate_manual_result_write_receipts(scope, write_status, created_at DESC)
    `,
  },
];

export const researchCandidateManualExpectedObservedDeltaRecordsTableSql = `
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
  )
`;

export const researchCandidateManualExpectedObservedDeltaRecordsIndexes = [
  {
    name: "idx_research_candidate_manual_eod_records_receipt",
    sql: `
      CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_eod_records_receipt
        ON research_candidate_manual_expected_observed_delta_records(receipt_id)
    `,
  },
  {
    name: "idx_research_candidate_manual_eod_records_scope_time",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_eod_records_scope_time
        ON research_candidate_manual_expected_observed_delta_records(scope, created_at DESC)
    `,
  },
];

export const researchCandidateManualReuseOutcomeRecordsTableSql = `
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
  )
`;

export const researchCandidateManualReuseOutcomeRecordsIndexes = [
  {
    name: "idx_research_candidate_manual_reuse_records_receipt",
    sql: `
      CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_reuse_records_receipt
        ON research_candidate_manual_reuse_outcome_records(receipt_id)
    `,
  },
  {
    name: "idx_research_candidate_manual_reuse_records_scope_time",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_reuse_records_scope_time
        ON research_candidate_manual_reuse_outcome_records(scope, created_at DESC)
    `,
  },
];

export const researchCandidateManualResultWriteRollbacksTableSql = `
  CREATE TABLE IF NOT EXISTS research_candidate_manual_result_write_rollbacks (
    rollback_id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    receipt_id TEXT NOT NULL,
    rollback_reason TEXT NOT NULL,
    authority_profile TEXT NOT NULL,
    rollback_fingerprint TEXT NOT NULL,
    FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_result_write_receipts(receipt_id)
  )
`;

export const researchCandidateManualResultWriteRollbacksIndexes = [
  {
    name: "idx_research_candidate_manual_result_rollbacks_receipt",
    sql: `
      CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_result_rollbacks_receipt
        ON research_candidate_manual_result_write_rollbacks(receipt_id)
    `,
  },
  {
    name: "idx_research_candidate_manual_result_rollbacks_time",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_result_rollbacks_time
        ON research_candidate_manual_result_write_rollbacks(created_at DESC)
    `,
  },
];

export function migrateResearchCandidateManualResultRecords(db) {
  const tableNames = [
    "research_candidate_manual_result_write_receipts",
    "research_candidate_manual_expected_observed_delta_records",
    "research_candidate_manual_reuse_outcome_records",
    "research_candidate_manual_result_write_rollbacks",
  ];
  const existingTables = new Set(
    db
      .prepare(
        `
          SELECT name
          FROM sqlite_master
          WHERE type = 'table'
            AND name IN (${tableNames.map(() => "?").join(", ")})
        `,
      )
      .all(...tableNames)
      .map((table) => table.name),
  );

  db.prepare(researchCandidateManualResultWriteReceiptsTableSql).run();
  db.prepare(researchCandidateManualExpectedObservedDeltaRecordsTableSql).run();
  db.prepare(researchCandidateManualReuseOutcomeRecordsTableSql).run();
  db.prepare(researchCandidateManualResultWriteRollbacksTableSql).run();

  const indexGroups = [
    {
      table: "research_candidate_manual_result_write_receipts",
      indexes: researchCandidateManualResultWriteReceiptsIndexes,
    },
    {
      table: "research_candidate_manual_expected_observed_delta_records",
      indexes: researchCandidateManualExpectedObservedDeltaRecordsIndexes,
    },
    {
      table: "research_candidate_manual_reuse_outcome_records",
      indexes: researchCandidateManualReuseOutcomeRecordsIndexes,
    },
    {
      table: "research_candidate_manual_result_write_rollbacks",
      indexes: researchCandidateManualResultWriteRollbacksIndexes,
    },
  ];
  const createdIndexes = [];

  for (const { table, indexes } of indexGroups) {
    const existingIndexes = new Set(
      db
        .prepare(
          `
            SELECT name
            FROM sqlite_master
            WHERE type = 'index'
              AND tbl_name = ?
          `,
        )
        .all(table)
        .map((index) => index.name),
    );

    for (const { name, sql } of indexes) {
      if (!existingIndexes.has(name)) {
        db.prepare(sql).run();
        createdIndexes.push(name);
      }
    }
  }

  return {
    table_found: true,
    created_tables: tableNames.filter((tableName) => !existingTables.has(tableName)),
    created_indexes: createdIndexes,
  };
}

export const perspectiveMemoryProductPersistenceBoundaryTableSql = `
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
  )
`;

export const perspectiveMemoryProductPersistenceBoundaryIndexes = [
  {
    name: "idx_perspective_memory_boundary_status_time",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_perspective_memory_boundary_status_time
        ON perspective_memory_product_persistence_boundary_records(boundary_status, created_at DESC)
    `,
  },
  {
    name: "idx_perspective_memory_boundary_checklist",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_perspective_memory_boundary_checklist
        ON perspective_memory_product_persistence_boundary_records(source_checklist_id)
    `,
  },
  {
    name: "idx_perspective_memory_boundary_proposal",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_perspective_memory_boundary_proposal
        ON perspective_memory_product_persistence_boundary_records(source_proposal_id)
    `,
  },
  {
    name: "idx_perspective_memory_boundary_queue",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_perspective_memory_boundary_queue
        ON perspective_memory_product_persistence_boundary_records(source_queue_item_id)
    `,
  },
];

export function migratePerspectiveMemoryProductPersistenceBoundaryRecords(db) {
  const existingTable = db
    .prepare(
      `
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name = 'perspective_memory_product_persistence_boundary_records'
      `,
    )
    .get();
  const createdTable = !existingTable;

  db.prepare(perspectiveMemoryProductPersistenceBoundaryTableSql).run();

  const existingIndexes = new Set(
    db
      .prepare(
        `
          SELECT name
          FROM sqlite_master
          WHERE type = 'index'
            AND tbl_name = 'perspective_memory_product_persistence_boundary_records'
        `,
      )
      .all()
      .map((index) => index.name),
  );
  const createdIndexes = [];

  for (const { name, sql } of perspectiveMemoryProductPersistenceBoundaryIndexes) {
    if (!existingIndexes.has(name)) {
      db.prepare(sql).run();
      createdIndexes.push(name);
    }
  }

  return {
    table_found: true,
    created_table: createdTable,
    created_indexes: createdIndexes,
  };
}

export const perspectiveMemoryItemsTableSql = `
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
  )
`;

export const perspectiveMemoryItemIndexes = [
  {
    name: "idx_perspective_memory_items_status_time",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_perspective_memory_items_status_time
        ON perspective_memory_items(item_status, created_at DESC)
    `,
  },
  {
    name: "idx_perspective_memory_items_kind_time",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_perspective_memory_items_kind_time
        ON perspective_memory_items(memory_kind, created_at DESC)
    `,
  },
  {
    name: "idx_perspective_memory_items_boundary",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_perspective_memory_items_boundary
        ON perspective_memory_items(source_boundary_record_id)
    `,
  },
  {
    name: "idx_perspective_memory_items_validation",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_perspective_memory_items_validation
        ON perspective_memory_items(source_validation_result_state, created_at DESC)
    `,
  },
  {
    name: "idx_perspective_memory_items_source_candidate",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_perspective_memory_items_source_candidate
        ON perspective_memory_items(source_candidate_draft_id)
    `,
  },
];

export function migratePerspectiveMemoryItems(db) {
  const existingTable = db
    .prepare(
      `
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name = 'perspective_memory_items'
      `,
    )
    .get();
  const createdTable = !existingTable;

  db.prepare(perspectiveMemoryItemsTableSql).run();

  const existingIndexes = new Set(
    db
      .prepare(
        `
          SELECT name
          FROM sqlite_master
          WHERE type = 'index'
            AND tbl_name = 'perspective_memory_items'
        `,
      )
      .all()
      .map((index) => index.name),
  );
  const createdIndexes = [];

  for (const { name, sql } of perspectiveMemoryItemIndexes) {
    if (!existingIndexes.has(name)) {
      db.prepare(sql).run();
      createdIndexes.push(name);
    }
  }

  return {
    table_found: true,
    created_table: createdTable,
    created_indexes: createdIndexes,
  };
}

export function migrateMailboxCoordinationEventTypes(db) {
  const table = db
    .prepare(
      `
        SELECT sql
        FROM sqlite_master
        WHERE type = 'table' AND name = 'coordination_events'
      `,
    )
    .get();

  if (!table) {
    return {
      table_found: false,
      rebuilt_coordination_events: false,
    };
  }

  const tableSql = typeof table.sql === "string" ? table.sql : "";
  if (
    mailboxCoordinationEventTypes.every((eventType) =>
      tableSql.includes(eventType),
    )
  ) {
    return {
      table_found: true,
      rebuilt_coordination_events: false,
    };
  }

  db.transaction(() => {
    db.prepare(
      `
        CREATE TABLE coordination_events_next (
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
          FOREIGN KEY (causal_parent_id) REFERENCES coordination_events_next(event_id)
        )
      `,
    ).run();

    db.prepare(
      `
        INSERT INTO coordination_events_next (
          event_id,
          event_type,
          scope,
          work_id,
          actor,
          target,
          source_surface,
          authority_level,
          state_keys,
          causal_parent_id,
          payload_ref,
          result_status,
          created_at
        )
        SELECT
          event_id,
          event_type,
          scope,
          work_id,
          actor,
          target,
          source_surface,
          authority_level,
          state_keys,
          causal_parent_id,
          payload_ref,
          result_status,
          created_at
        FROM coordination_events
      `,
    ).run();

    db.prepare("DROP TABLE coordination_events").run();
    db.prepare(
      "ALTER TABLE coordination_events_next RENAME TO coordination_events",
    ).run();
  })();

  return {
    table_found: true,
    rebuilt_coordination_events: true,
  };
}
