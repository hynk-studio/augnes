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

export const researchCandidateManualGlobalDogfoodLedgerReceiptsTableSql = `
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
  )
`;

export const researchCandidateManualGlobalDogfoodLedgerRecordsTableSql = `
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
  )
`;

export const researchCandidateManualGlobalDogfoodLedgerRollbacksTableSql = `
  CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_ledger_rollbacks (
    rollback_id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    receipt_id TEXT NOT NULL,
    rollback_reason TEXT NOT NULL,
    authority_profile TEXT NOT NULL,
    rollback_fingerprint TEXT NOT NULL,
    FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_global_dogfood_ledger_receipts(receipt_id)
  )
`;

export const researchCandidateManualGlobalDogfoodLedgerIndexes = [
  {
    table: "research_candidate_manual_global_dogfood_ledger_receipts",
    name: "idx_research_candidate_manual_global_dogfood_receipts_scope_time",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_receipts_scope_time
        ON research_candidate_manual_global_dogfood_ledger_receipts(scope, created_at DESC)
    `,
  },
  {
    table: "research_candidate_manual_global_dogfood_ledger_receipts",
    name: "idx_research_candidate_manual_global_dogfood_receipts_status",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_receipts_status
        ON research_candidate_manual_global_dogfood_ledger_receipts(scope, ledger_write_status, created_at DESC)
    `,
  },
  {
    table: "research_candidate_manual_global_dogfood_ledger_receipts",
    name: "idx_research_candidate_manual_global_dogfood_receipts_source_manual",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_receipts_source_manual
        ON research_candidate_manual_global_dogfood_ledger_receipts(source_manual_receipt_id, created_at DESC)
    `,
  },
  {
    table: "research_candidate_manual_global_dogfood_ledger_receipts",
    name: "idx_research_candidate_manual_global_dogfood_receipts_contract",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_receipts_contract
        ON research_candidate_manual_global_dogfood_ledger_receipts(source_contract_fingerprint, created_at DESC)
    `,
  },
  {
    table: "research_candidate_manual_global_dogfood_ledger_records",
    name: "idx_research_candidate_manual_global_dogfood_records_receipt",
    sql: `
      CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_records_receipt
        ON research_candidate_manual_global_dogfood_ledger_records(receipt_id)
    `,
  },
  {
    table: "research_candidate_manual_global_dogfood_ledger_records",
    name: "idx_research_candidate_manual_global_dogfood_records_scope_time",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_records_scope_time
        ON research_candidate_manual_global_dogfood_ledger_records(scope, created_at DESC)
    `,
  },
  {
    table: "research_candidate_manual_global_dogfood_ledger_rollbacks",
    name: "idx_research_candidate_manual_global_dogfood_rollbacks_receipt",
    sql: `
      CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_rollbacks_receipt
        ON research_candidate_manual_global_dogfood_ledger_rollbacks(receipt_id)
    `,
  },
  {
    table: "research_candidate_manual_global_dogfood_ledger_rollbacks",
    name: "idx_research_candidate_manual_global_dogfood_rollbacks_time",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_rollbacks_time
        ON research_candidate_manual_global_dogfood_ledger_rollbacks(created_at DESC)
    `,
  },
];

export function migrateResearchCandidateManualGlobalDogfoodLedger(db) {
  const tableNames = [
    "research_candidate_manual_global_dogfood_ledger_receipts",
    "research_candidate_manual_global_dogfood_ledger_records",
    "research_candidate_manual_global_dogfood_ledger_rollbacks",
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

  db.prepare(researchCandidateManualGlobalDogfoodLedgerReceiptsTableSql).run();
  db.prepare(researchCandidateManualGlobalDogfoodLedgerRecordsTableSql).run();
  db.prepare(researchCandidateManualGlobalDogfoodLedgerRollbacksTableSql).run();

  const createdIndexes = [];
  for (const { table, name, sql } of researchCandidateManualGlobalDogfoodLedgerIndexes) {
    const existingIndex = db
      .prepare(
        `
          SELECT name
          FROM sqlite_master
          WHERE type = 'index'
            AND tbl_name = ?
            AND name = ?
        `,
      )
      .get(table, name);
    if (!existingIndex) {
      db.prepare(sql).run();
      createdIndexes.push(name);
    }
  }

  return {
    table_found: true,
    created_tables: tableNames.filter((tableName) => !existingTables.has(tableName)),
    created_indexes: createdIndexes,
  };
}

export const researchCandidateManualGlobalDogfoodMetricSnapshotReceiptsTableSql = `
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
  )
`;

export const researchCandidateManualGlobalDogfoodMetricSnapshotRecordsTableSql = `
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
  )
`;

export const researchCandidateManualGlobalDogfoodMetricSnapshotRollbacksTableSql = `
  CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_metric_snapshot_rollbacks (
    rollback_id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    receipt_id TEXT NOT NULL,
    rollback_reason TEXT NOT NULL,
    authority_profile TEXT NOT NULL,
    rollback_fingerprint TEXT NOT NULL,
    FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_global_dogfood_metric_snapshot_receipts(receipt_id)
  )
`;

export const researchCandidateManualGlobalDogfoodMetricSnapshotIndexes = [
  {
    table: "research_candidate_manual_global_dogfood_metric_snapshot_receipts",
    name: "idx_research_candidate_manual_global_dogfood_metric_snapshot_receipts_scope_time",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_metric_snapshot_receipts_scope_time
        ON research_candidate_manual_global_dogfood_metric_snapshot_receipts(scope, created_at DESC)
    `,
  },
  {
    table: "research_candidate_manual_global_dogfood_metric_snapshot_receipts",
    name: "idx_research_candidate_manual_global_dogfood_metric_snapshot_receipts_status",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_metric_snapshot_receipts_status
        ON research_candidate_manual_global_dogfood_metric_snapshot_receipts(scope, write_status, created_at DESC)
    `,
  },
  {
    table: "research_candidate_manual_global_dogfood_metric_snapshot_receipts",
    name: "idx_research_candidate_manual_global_dogfood_metric_snapshot_receipts_source_projection",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_metric_snapshot_receipts_source_projection
        ON research_candidate_manual_global_dogfood_metric_snapshot_receipts(source_projection_fingerprint, created_at DESC)
    `,
  },
  {
    table: "research_candidate_manual_global_dogfood_metric_snapshot_receipts",
    name: "idx_research_candidate_manual_global_dogfood_metric_snapshot_receipts_source_ledger",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_metric_snapshot_receipts_source_ledger
        ON research_candidate_manual_global_dogfood_metric_snapshot_receipts(source_global_dogfood_ledger_receipt_id, created_at DESC)
    `,
  },
  {
    table: "research_candidate_manual_global_dogfood_metric_snapshot_records",
    name: "idx_research_candidate_manual_global_dogfood_metric_snapshot_records_receipt",
    sql: `
      CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_metric_snapshot_records_receipt
        ON research_candidate_manual_global_dogfood_metric_snapshot_records(receipt_id)
    `,
  },
  {
    table: "research_candidate_manual_global_dogfood_metric_snapshot_records",
    name: "idx_research_candidate_manual_global_dogfood_metric_snapshot_records_scope_time",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_metric_snapshot_records_scope_time
        ON research_candidate_manual_global_dogfood_metric_snapshot_records(scope, created_at DESC)
    `,
  },
  {
    table: "research_candidate_manual_global_dogfood_metric_snapshot_rollbacks",
    name: "idx_research_candidate_manual_global_dogfood_metric_snapshot_rollbacks_receipt",
    sql: `
      CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_metric_snapshot_rollbacks_receipt
        ON research_candidate_manual_global_dogfood_metric_snapshot_rollbacks(receipt_id)
    `,
  },
  {
    table: "research_candidate_manual_global_dogfood_metric_snapshot_rollbacks",
    name: "idx_research_candidate_manual_global_dogfood_metric_snapshot_rollbacks_time",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_metric_snapshot_rollbacks_time
        ON research_candidate_manual_global_dogfood_metric_snapshot_rollbacks(created_at DESC)
    `,
  },
];

export function migrateResearchCandidateManualGlobalDogfoodMetricSnapshot(db) {
  const tableNames = [
    "research_candidate_manual_global_dogfood_metric_snapshot_receipts",
    "research_candidate_manual_global_dogfood_metric_snapshot_records",
    "research_candidate_manual_global_dogfood_metric_snapshot_rollbacks",
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

  db.prepare(
    researchCandidateManualGlobalDogfoodMetricSnapshotReceiptsTableSql,
  ).run();
  db.prepare(
    researchCandidateManualGlobalDogfoodMetricSnapshotRecordsTableSql,
  ).run();
  db.prepare(
    researchCandidateManualGlobalDogfoodMetricSnapshotRollbacksTableSql,
  ).run();

  const createdIndexes = [];
  for (const { table, name, sql } of researchCandidateManualGlobalDogfoodMetricSnapshotIndexes) {
    const existingIndex = db
      .prepare(
        `
          SELECT name
          FROM sqlite_master
          WHERE type = 'index'
            AND tbl_name = ?
            AND name = ?
        `,
      )
      .get(table, name);
    if (!existingIndex) {
      db.prepare(sql).run();
      createdIndexes.push(name);
    }
  }

  return {
    table_found: true,
    created_tables: tableNames.filter((tableName) => !existingTables.has(tableName)),
    created_indexes: createdIndexes,
  };
}

export const researchCandidateManualGlobalDogfoodNextWorkSignalReceiptsTableSql = `
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
  )
`;

export const researchCandidateManualGlobalDogfoodNextWorkSignalRecordsTableSql = `
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
  )
`;

export const researchCandidateManualGlobalDogfoodNextWorkSignalRollbacksTableSql = `
  CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_next_work_signal_rollbacks (
    rollback_id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    receipt_id TEXT NOT NULL,
    rollback_reason TEXT NOT NULL,
    authority_profile TEXT NOT NULL,
    rollback_fingerprint TEXT NOT NULL,
    FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_global_dogfood_next_work_signal_receipts(receipt_id)
  )
`;

export const researchCandidateManualGlobalDogfoodNextWorkSignalIndexes = [
  {
    table: "research_candidate_manual_global_dogfood_next_work_signal_receipts",
    name: "idx_research_candidate_manual_global_dogfood_next_work_signal_receipts_scope_time",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_signal_receipts_scope_time
        ON research_candidate_manual_global_dogfood_next_work_signal_receipts(scope, created_at DESC)
    `,
  },
  {
    table: "research_candidate_manual_global_dogfood_next_work_signal_receipts",
    name: "idx_research_candidate_manual_global_dogfood_next_work_signal_receipts_status",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_signal_receipts_status
        ON research_candidate_manual_global_dogfood_next_work_signal_receipts(scope, write_status, created_at DESC)
    `,
  },
  {
    table: "research_candidate_manual_global_dogfood_next_work_signal_receipts",
    name: "idx_research_candidate_manual_global_dogfood_next_work_signal_receipts_source_projection",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_signal_receipts_source_projection
        ON research_candidate_manual_global_dogfood_next_work_signal_receipts(source_projection_fingerprint, created_at DESC)
    `,
  },
  {
    table: "research_candidate_manual_global_dogfood_next_work_signal_receipts",
    name: "idx_research_candidate_manual_global_dogfood_next_work_signal_receipts_source_ledger",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_signal_receipts_source_ledger
        ON research_candidate_manual_global_dogfood_next_work_signal_receipts(source_global_dogfood_ledger_receipt_id, created_at DESC)
    `,
  },
  {
    table: "research_candidate_manual_global_dogfood_next_work_signal_receipts",
    name: "idx_research_candidate_manual_global_dogfood_next_work_signal_receipts_source_metric",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_signal_receipts_source_metric
        ON research_candidate_manual_global_dogfood_next_work_signal_receipts(source_metric_snapshot_receipt_id, created_at DESC)
    `,
  },
  {
    table: "research_candidate_manual_global_dogfood_next_work_signal_records",
    name: "idx_research_candidate_manual_global_dogfood_next_work_signal_records_receipt",
    sql: `
      CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_signal_records_receipt
        ON research_candidate_manual_global_dogfood_next_work_signal_records(receipt_id)
    `,
  },
  {
    table: "research_candidate_manual_global_dogfood_next_work_signal_records",
    name: "idx_research_candidate_manual_global_dogfood_next_work_signal_records_scope_time",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_signal_records_scope_time
        ON research_candidate_manual_global_dogfood_next_work_signal_records(scope, created_at DESC)
    `,
  },
  {
    table: "research_candidate_manual_global_dogfood_next_work_signal_rollbacks",
    name: "idx_research_candidate_manual_global_dogfood_next_work_signal_rollbacks_receipt",
    sql: `
      CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_signal_rollbacks_receipt
        ON research_candidate_manual_global_dogfood_next_work_signal_rollbacks(receipt_id)
    `,
  },
  {
    table: "research_candidate_manual_global_dogfood_next_work_signal_rollbacks",
    name: "idx_research_candidate_manual_global_dogfood_next_work_signal_rollbacks_time",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_signal_rollbacks_time
        ON research_candidate_manual_global_dogfood_next_work_signal_rollbacks(created_at DESC)
    `,
  },
];

export function migrateResearchCandidateManualGlobalDogfoodNextWorkSignal(db) {
  const tableNames = [
    "research_candidate_manual_global_dogfood_next_work_signal_receipts",
    "research_candidate_manual_global_dogfood_next_work_signal_records",
    "research_candidate_manual_global_dogfood_next_work_signal_rollbacks",
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

  db.prepare(
    researchCandidateManualGlobalDogfoodNextWorkSignalReceiptsTableSql,
  ).run();
  db.prepare(
    researchCandidateManualGlobalDogfoodNextWorkSignalRecordsTableSql,
  ).run();
  db.prepare(
    researchCandidateManualGlobalDogfoodNextWorkSignalRollbacksTableSql,
  ).run();

  const createdIndexes = [];
  for (const { table, name, sql } of researchCandidateManualGlobalDogfoodNextWorkSignalIndexes) {
    const existingIndex = db
      .prepare(
        `
          SELECT name
          FROM sqlite_master
          WHERE type = 'index'
            AND tbl_name = ?
            AND name = ?
        `,
      )
      .get(table, name);
    if (!existingIndex) {
      db.prepare(sql).run();
      createdIndexes.push(name);
    }
  }

  return {
    table_found: true,
    created_tables: tableNames.filter((tableName) => !existingTables.has(tableName)),
    created_indexes: createdIndexes,
  };
}

export const researchCandidateManualGlobalDogfoodNextWorkBiasReceiptsTableSql = `
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
  )
`;

export const researchCandidateManualGlobalDogfoodNextWorkBiasRecordsTableSql = `
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
  )
`;

export const researchCandidateManualGlobalDogfoodNextWorkBiasRollbacksTableSql = `
  CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_next_work_bias_rollbacks (
    rollback_id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    receipt_id TEXT NOT NULL,
    rollback_reason TEXT NOT NULL,
    authority_profile TEXT NOT NULL,
    rollback_fingerprint TEXT NOT NULL,
    FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_global_dogfood_next_work_bias_receipts(receipt_id)
  )
`;

export const researchCandidateManualGlobalDogfoodNextWorkBiasIndexes = [
  {
    table: "research_candidate_manual_global_dogfood_next_work_bias_receipts",
    name: "idx_research_candidate_manual_global_dogfood_next_work_bias_receipts_scope_time",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_bias_receipts_scope_time
        ON research_candidate_manual_global_dogfood_next_work_bias_receipts(scope, created_at DESC)
    `,
  },
  {
    table: "research_candidate_manual_global_dogfood_next_work_bias_receipts",
    name: "idx_research_candidate_manual_global_dogfood_next_work_bias_receipts_status",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_bias_receipts_status
        ON research_candidate_manual_global_dogfood_next_work_bias_receipts(scope, write_status, created_at DESC)
    `,
  },
  {
    table: "research_candidate_manual_global_dogfood_next_work_bias_receipts",
    name: "idx_research_candidate_manual_global_dogfood_next_work_bias_receipts_source_signal",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_bias_receipts_source_signal
        ON research_candidate_manual_global_dogfood_next_work_bias_receipts(source_next_work_signal_receipt_id, created_at DESC)
    `,
  },
  {
    table: "research_candidate_manual_global_dogfood_next_work_bias_receipts",
    name: "idx_research_candidate_manual_global_dogfood_next_work_bias_receipts_source_projection",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_bias_receipts_source_projection
        ON research_candidate_manual_global_dogfood_next_work_bias_receipts(source_projection_fingerprint, created_at DESC)
    `,
  },
  {
    table: "research_candidate_manual_global_dogfood_next_work_bias_receipts",
    name: "idx_research_candidate_manual_global_dogfood_next_work_bias_receipts_source_ledger",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_bias_receipts_source_ledger
        ON research_candidate_manual_global_dogfood_next_work_bias_receipts(source_global_dogfood_ledger_receipt_id, created_at DESC)
    `,
  },
  {
    table: "research_candidate_manual_global_dogfood_next_work_bias_receipts",
    name: "idx_research_candidate_manual_global_dogfood_next_work_bias_receipts_source_metric",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_bias_receipts_source_metric
        ON research_candidate_manual_global_dogfood_next_work_bias_receipts(source_metric_snapshot_receipt_id, created_at DESC)
    `,
  },
  {
    table: "research_candidate_manual_global_dogfood_next_work_bias_records",
    name: "idx_research_candidate_manual_global_dogfood_next_work_bias_records_receipt",
    sql: `
      CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_bias_records_receipt
        ON research_candidate_manual_global_dogfood_next_work_bias_records(receipt_id)
    `,
  },
  {
    table: "research_candidate_manual_global_dogfood_next_work_bias_records",
    name: "idx_research_candidate_manual_global_dogfood_next_work_bias_records_scope_time",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_bias_records_scope_time
        ON research_candidate_manual_global_dogfood_next_work_bias_records(scope, created_at DESC)
    `,
  },
  {
    table: "research_candidate_manual_global_dogfood_next_work_bias_rollbacks",
    name: "idx_research_candidate_manual_global_dogfood_next_work_bias_rollbacks_receipt",
    sql: `
      CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_bias_rollbacks_receipt
        ON research_candidate_manual_global_dogfood_next_work_bias_rollbacks(receipt_id)
    `,
  },
  {
    table: "research_candidate_manual_global_dogfood_next_work_bias_rollbacks",
    name: "idx_research_candidate_manual_global_dogfood_next_work_bias_rollbacks_time",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_next_work_bias_rollbacks_time
        ON research_candidate_manual_global_dogfood_next_work_bias_rollbacks(created_at DESC)
    `,
  },
];

export function migrateResearchCandidateManualGlobalDogfoodNextWorkBias(db) {
  const tableNames = [
    "research_candidate_manual_global_dogfood_next_work_bias_receipts",
    "research_candidate_manual_global_dogfood_next_work_bias_records",
    "research_candidate_manual_global_dogfood_next_work_bias_rollbacks",
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

  db.prepare(
    researchCandidateManualGlobalDogfoodNextWorkBiasReceiptsTableSql,
  ).run();
  db.prepare(
    researchCandidateManualGlobalDogfoodNextWorkBiasRecordsTableSql,
  ).run();
  db.prepare(
    researchCandidateManualGlobalDogfoodNextWorkBiasRollbacksTableSql,
  ).run();

  const createdIndexes = [];
  for (const { table, name, sql } of researchCandidateManualGlobalDogfoodNextWorkBiasIndexes) {
    const existingIndex = db
      .prepare(
        `
          SELECT name
          FROM sqlite_master
          WHERE type = 'index'
            AND tbl_name = ?
            AND name = ?
        `,
      )
      .get(table, name);
    if (!existingIndex) {
      db.prepare(sql).run();
      createdIndexes.push(name);
    }
  }

  return {
    table_found: true,
    created_tables: tableNames.filter((tableName) => !existingTables.has(tableName)),
    created_indexes: createdIndexes,
  };
}

export const researchCandidateManualGlobalDogfoodPerspectiveRelayReceiptsTableSql = `
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
  )
`;

export const researchCandidateManualGlobalDogfoodPerspectiveRelayRecordsTableSql = `
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
  )
`;

export const researchCandidateManualGlobalDogfoodPerspectiveRelayRollbacksTableSql = `
  CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_perspective_relay_rollbacks (
    rollback_id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    receipt_id TEXT NOT NULL,
    rollback_reason TEXT NOT NULL,
    authority_profile TEXT NOT NULL,
    rollback_fingerprint TEXT NOT NULL,
    FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_global_dogfood_perspective_relay_receipts(receipt_id)
  )
`;

export const researchCandidateManualGlobalDogfoodPerspectiveRelayIndexes = [
  {
    table: "research_candidate_manual_global_dogfood_perspective_relay_receipts",
    name: "idx_research_candidate_manual_global_dogfood_perspective_relay_receipts_scope_time",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_relay_receipts_scope_time
        ON research_candidate_manual_global_dogfood_perspective_relay_receipts(scope, created_at DESC)
    `,
  },
  {
    table: "research_candidate_manual_global_dogfood_perspective_relay_receipts",
    name: "idx_research_candidate_manual_global_dogfood_perspective_relay_receipts_status",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_relay_receipts_status
        ON research_candidate_manual_global_dogfood_perspective_relay_receipts(scope, write_status, created_at DESC)
    `,
  },
  {
    table: "research_candidate_manual_global_dogfood_perspective_relay_receipts",
    name: "idx_research_candidate_manual_global_dogfood_perspective_relay_receipts_source_signal",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_relay_receipts_source_signal
        ON research_candidate_manual_global_dogfood_perspective_relay_receipts(source_next_work_signal_receipt_id, created_at DESC)
    `,
  },
  {
    table: "research_candidate_manual_global_dogfood_perspective_relay_receipts",
    name: "idx_research_candidate_manual_global_dogfood_perspective_relay_receipts_source_bias",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_relay_receipts_source_bias
        ON research_candidate_manual_global_dogfood_perspective_relay_receipts(source_next_work_bias_receipt_id, created_at DESC)
    `,
  },
  {
    table: "research_candidate_manual_global_dogfood_perspective_relay_receipts",
    name: "idx_research_candidate_manual_global_dogfood_perspective_relay_receipts_source_projection",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_relay_receipts_source_projection
        ON research_candidate_manual_global_dogfood_perspective_relay_receipts(source_projection_fingerprint, created_at DESC)
    `,
  },
  {
    table: "research_candidate_manual_global_dogfood_perspective_relay_receipts",
    name: "idx_research_candidate_manual_global_dogfood_perspective_relay_receipts_source_ledger",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_relay_receipts_source_ledger
        ON research_candidate_manual_global_dogfood_perspective_relay_receipts(source_global_dogfood_ledger_receipt_id, created_at DESC)
    `,
  },
  {
    table: "research_candidate_manual_global_dogfood_perspective_relay_receipts",
    name: "idx_research_candidate_manual_global_dogfood_perspective_relay_receipts_source_metric",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_relay_receipts_source_metric
        ON research_candidate_manual_global_dogfood_perspective_relay_receipts(source_metric_snapshot_receipt_id, created_at DESC)
    `,
  },
  {
    table: "research_candidate_manual_global_dogfood_perspective_relay_records",
    name: "idx_research_candidate_manual_global_dogfood_perspective_relay_records_receipt",
    sql: `
      CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_relay_records_receipt
        ON research_candidate_manual_global_dogfood_perspective_relay_records(receipt_id)
    `,
  },
  {
    table: "research_candidate_manual_global_dogfood_perspective_relay_records",
    name: "idx_research_candidate_manual_global_dogfood_perspective_relay_records_scope_time",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_relay_records_scope_time
        ON research_candidate_manual_global_dogfood_perspective_relay_records(scope, created_at DESC)
    `,
  },
  {
    table: "research_candidate_manual_global_dogfood_perspective_relay_rollbacks",
    name: "idx_research_candidate_manual_global_dogfood_perspective_relay_rollbacks_receipt",
    sql: `
      CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_relay_rollbacks_receipt
        ON research_candidate_manual_global_dogfood_perspective_relay_rollbacks(receipt_id)
    `,
  },
  {
    table: "research_candidate_manual_global_dogfood_perspective_relay_rollbacks",
    name: "idx_research_candidate_manual_global_dogfood_perspective_relay_rollbacks_time",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_perspective_relay_rollbacks_time
        ON research_candidate_manual_global_dogfood_perspective_relay_rollbacks(created_at DESC)
    `,
  },
];

export function migrateResearchCandidateManualGlobalDogfoodPerspectiveRelay(db) {
  const tableNames = [
    "research_candidate_manual_global_dogfood_perspective_relay_receipts",
    "research_candidate_manual_global_dogfood_perspective_relay_records",
    "research_candidate_manual_global_dogfood_perspective_relay_rollbacks",
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

  db.prepare(
    researchCandidateManualGlobalDogfoodPerspectiveRelayReceiptsTableSql,
  ).run();
  db.prepare(
    researchCandidateManualGlobalDogfoodPerspectiveRelayRecordsTableSql,
  ).run();
  db.prepare(
    researchCandidateManualGlobalDogfoodPerspectiveRelayRollbacksTableSql,
  ).run();

  const createdIndexes = [];
  for (const { table, name, sql } of researchCandidateManualGlobalDogfoodPerspectiveRelayIndexes) {
    const existingIndex = db
      .prepare(
        `
          SELECT name
          FROM sqlite_master
          WHERE type = 'index'
            AND tbl_name = ?
            AND name = ?
        `,
      )
      .get(table, name);
    if (!existingIndex) {
      db.prepare(sql).run();
      createdIndexes.push(name);
    }
  }

  return {
    table_found: true,
    created_tables: tableNames.filter((tableName) => !existingTables.has(tableName)),
    created_indexes: createdIndexes,
  };
}

export const researchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReceiptsTableSql = `
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
  )
`;

export const researchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateRecordsTableSql = `
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
  )
`;

export const researchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateRollbacksTableSql = `
  CREATE TABLE IF NOT EXISTS research_candidate_manual_global_dogfood_canonical_perspective_update_rollbacks (
    rollback_id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    receipt_id TEXT NOT NULL,
    rollback_reason TEXT NOT NULL,
    authority_profile TEXT NOT NULL,
    rollback_fingerprint TEXT NOT NULL,
    FOREIGN KEY (receipt_id) REFERENCES research_candidate_manual_global_dogfood_canonical_perspective_update_receipts(receipt_id)
  )
`;

export const researchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateIndexes = [
  {
    table: "research_candidate_manual_global_dogfood_canonical_perspective_update_receipts",
    name: "idx_research_candidate_manual_global_dogfood_canonical_perspective_update_receipts_scope_time",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_canonical_perspective_update_receipts_scope_time
        ON research_candidate_manual_global_dogfood_canonical_perspective_update_receipts(scope, created_at DESC)
    `,
  },
  {
    table: "research_candidate_manual_global_dogfood_canonical_perspective_update_receipts",
    name: "idx_research_candidate_manual_global_dogfood_canonical_perspective_update_receipts_status",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_canonical_perspective_update_receipts_status
        ON research_candidate_manual_global_dogfood_canonical_perspective_update_receipts(scope, write_status, created_at DESC)
    `,
  },
  {
    table: "research_candidate_manual_global_dogfood_canonical_perspective_update_receipts",
    name: "idx_research_candidate_manual_global_dogfood_canonical_perspective_update_receipts_source_relay",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_canonical_perspective_update_receipts_source_relay
        ON research_candidate_manual_global_dogfood_canonical_perspective_update_receipts(source_perspective_relay_receipt_id, created_at DESC)
    `,
  },
  {
    table: "research_candidate_manual_global_dogfood_canonical_perspective_update_receipts",
    name: "idx_research_candidate_manual_global_dogfood_canonical_perspective_update_receipts_source_signal",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_canonical_perspective_update_receipts_source_signal
        ON research_candidate_manual_global_dogfood_canonical_perspective_update_receipts(source_next_work_signal_receipt_id, created_at DESC)
    `,
  },
  {
    table: "research_candidate_manual_global_dogfood_canonical_perspective_update_receipts",
    name: "idx_research_candidate_manual_global_dogfood_canonical_perspective_update_receipts_source_bias",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_canonical_perspective_update_receipts_source_bias
        ON research_candidate_manual_global_dogfood_canonical_perspective_update_receipts(source_next_work_bias_receipt_id, created_at DESC)
    `,
  },
  {
    table: "research_candidate_manual_global_dogfood_canonical_perspective_update_receipts",
    name: "idx_research_candidate_manual_global_dogfood_canonical_perspective_update_receipts_source_projection",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_canonical_perspective_update_receipts_source_projection
        ON research_candidate_manual_global_dogfood_canonical_perspective_update_receipts(source_projection_fingerprint, created_at DESC)
    `,
  },
  {
    table: "research_candidate_manual_global_dogfood_canonical_perspective_update_receipts",
    name: "idx_research_candidate_manual_global_dogfood_canonical_perspective_update_receipts_source_ledger",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_canonical_perspective_update_receipts_source_ledger
        ON research_candidate_manual_global_dogfood_canonical_perspective_update_receipts(source_global_dogfood_ledger_receipt_id, created_at DESC)
    `,
  },
  {
    table: "research_candidate_manual_global_dogfood_canonical_perspective_update_receipts",
    name: "idx_research_candidate_manual_global_dogfood_canonical_perspective_update_receipts_source_metric",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_canonical_perspective_update_receipts_source_metric
        ON research_candidate_manual_global_dogfood_canonical_perspective_update_receipts(source_metric_snapshot_receipt_id, created_at DESC)
    `,
  },
  {
    table: "research_candidate_manual_global_dogfood_canonical_perspective_update_records",
    name: "idx_research_candidate_manual_global_dogfood_canonical_perspective_update_records_receipt",
    sql: `
      CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_canonical_perspective_update_records_receipt
        ON research_candidate_manual_global_dogfood_canonical_perspective_update_records(receipt_id)
    `,
  },
  {
    table: "research_candidate_manual_global_dogfood_canonical_perspective_update_records",
    name: "idx_research_candidate_manual_global_dogfood_canonical_perspective_update_records_scope_time",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_canonical_perspective_update_records_scope_time
        ON research_candidate_manual_global_dogfood_canonical_perspective_update_records(scope, created_at DESC)
    `,
  },
  {
    table: "research_candidate_manual_global_dogfood_canonical_perspective_update_rollbacks",
    name: "idx_research_candidate_manual_global_dogfood_canonical_perspective_update_rollbacks_receipt",
    sql: `
      CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_canonical_perspective_update_rollbacks_receipt
        ON research_candidate_manual_global_dogfood_canonical_perspective_update_rollbacks(receipt_id)
    `,
  },
  {
    table: "research_candidate_manual_global_dogfood_canonical_perspective_update_rollbacks",
    name: "idx_research_candidate_manual_global_dogfood_canonical_perspective_update_rollbacks_time",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_research_candidate_manual_global_dogfood_canonical_perspective_update_rollbacks_time
        ON research_candidate_manual_global_dogfood_canonical_perspective_update_rollbacks(created_at DESC)
    `,
  },
];

export function migrateResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdate(db) {
  const tableNames = [
    "research_candidate_manual_global_dogfood_canonical_perspective_update_receipts",
    "research_candidate_manual_global_dogfood_canonical_perspective_update_records",
    "research_candidate_manual_global_dogfood_canonical_perspective_update_rollbacks",
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

  db.prepare(
    researchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReceiptsTableSql,
  ).run();
  db.prepare(
    researchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateRecordsTableSql,
  ).run();
  db.prepare(
    researchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateRollbacksTableSql,
  ).run();

  const createdIndexes = [];
  for (const { table, name, sql } of researchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateIndexes) {
    const existingIndex = db
      .prepare(
        `
          SELECT name
          FROM sqlite_master
          WHERE type = 'index'
            AND tbl_name = ?
            AND name = ?
        `,
      )
      .get(table, name);
    if (!existingIndex) {
      db.prepare(sql).run();
      createdIndexes.push(name);
    }
  }

  return {
    table_found: true,
    created_tables: tableNames.filter((tableName) => !existingTables.has(tableName)),
    created_indexes: createdIndexes,
  };
}

export function migrateResearchCandidateManualGlobalDogfoodPerspectiveApply(db) {
  const tableNames = [
    "research_candidate_manual_global_dogfood_perspective_apply_receipts",
    "research_candidate_manual_global_dogfood_perspective_apply_records",
    "research_candidate_manual_global_dogfood_perspective_apply_rollbacks",
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

  db.exec(`
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
        write_status IN ('committed', 'duplicate_replayed', 'superseded', 'rolled_back')
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
  `);

  return {
    table_found: true,
    created_tables: tableNames.filter((tableName) => !existingTables.has(tableName)),
    created_indexes: [],
  };
}

export function migrateResearchCandidateManualGlobalDogfoodPerspectiveStateMutation(db) {
  const tableNames = [
    "research_candidate_manual_global_dogfood_perspective_state_mutation_receipts",
    "research_candidate_manual_global_dogfood_perspective_state_mutation_records",
    "research_candidate_manual_global_dogfood_perspective_state_mutation_rollbacks",
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

  db.exec(`
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
        write_status IN ('committed', 'duplicate_replayed', 'superseded', 'rolled_back')
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
  `);

  return {
    table_found: true,
    created_tables: tableNames.filter((tableName) => !existingTables.has(tableName)),
    created_indexes: [],
  };
}

export function migrateResearchCandidateManualGlobalDogfoodPerspectiveAdapter(db) {
  const tableNames = [
    "research_candidate_manual_global_dogfood_perspective_adapter_receipts",
    "research_candidate_manual_global_dogfood_perspective_adapter_records",
    "research_candidate_manual_global_dogfood_perspective_adapter_rollbacks",
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

  db.exec(`
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
        write_status IN ('committed', 'duplicate_replayed', 'superseded', 'rolled_back')
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
  `);

  return {
    table_found: true,
    created_tables: tableNames.filter((tableName) => !existingTables.has(tableName)),
    created_indexes: [],
  };
}

export function migrateResearchCandidateManualGlobalDogfoodPerspectiveStateApplication(db) {
  const tableNames = [
    "research_candidate_manual_global_dogfood_perspective_state_application_receipts",
    "research_candidate_manual_global_dogfood_perspective_state_application_records",
    "research_candidate_manual_global_dogfood_perspective_state_application_rollbacks",
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

  db.exec(`
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

  `);

  return {
    table_found: true,
    created_tables: tableNames.filter((tableName) => !existingTables.has(tableName)),
    created_indexes: [],
  };
}

export function migrateResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibility(db) {
  const tableNames = [
    "research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts",
    "research_candidate_manual_global_dogfood_perspective_writer_compatibility_records",
    "research_candidate_manual_global_dogfood_perspective_writer_compatibility_rollbacks",
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

  db.exec(`
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
  `);

  return {
    table_found: true,
    created_tables: tableNames.filter((tableName) => !existingTables.has(tableName)),
    created_indexes: [],
  };
}

export function migrateResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecord(db) {
  const tableName =
    "research_candidate_manual_global_dogfood_perspective_existing_writer_no_mutation_result_records";
  const existingTable = db
    .prepare(
      `
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name = ?
      `,
    )
    .get(tableName);
  const indexNames = [
    "idx_research_candidate_manual_global_dogfood_perspective_existing_writer_no_mutation_result_records_scope_time",
    "idx_research_candidate_manual_global_dogfood_perspective_existing_writer_no_mutation_result_records_source_review",
    "idx_research_candidate_manual_global_dogfood_perspective_existing_writer_no_mutation_result_records_source_entrypoint",
  ];
  const existingIndexes = new Set(
    db
      .prepare(
        `
          SELECT name
          FROM sqlite_master
          WHERE type = 'index'
            AND name IN (${indexNames.map(() => "?").join(", ")})
        `,
      )
      .all(...indexNames)
      .map((index) => index.name),
  );

  db.exec(`
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
  `);

  return {
    table_found: true,
    created_tables: existingTable ? [] : [tableName],
    created_indexes: indexNames.filter((indexName) => !existingIndexes.has(indexName)),
  };
}

export function migrateAutonomyDelegationGrants(db) {
  const tableName = "autonomy_delegation_grants";
  const existingTable = db
    .prepare(
      `
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name = ?
      `,
    )
    .get(tableName);
  const indexNames = [
    "idx_autonomy_delegation_grants_scope_created",
    "idx_autonomy_delegation_grants_scope_status_created",
    "idx_autonomy_delegation_grants_scope_mode_created",
    "idx_autonomy_delegation_grants_approval_ref",
    "idx_autonomy_delegation_grants_source_contract_fingerprint",
  ];
  const existingIndexes = new Set(
    db
      .prepare(
        `
          SELECT name
          FROM sqlite_master
          WHERE type = 'index'
            AND name IN (${indexNames.map(() => "?").join(", ")})
        `,
      )
      .all(...indexNames)
      .map((index) => index.name),
  );

  db.exec(`
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
  `);

  return {
    table_found: true,
    created_tables: existingTable ? [] : [tableName],
    created_indexes: indexNames.filter((indexName) => !existingIndexes.has(indexName)),
  };
}

export function migrateAutohuntWorkQueueCandidates(db) {
  const tableName = "autohunt_work_queue_candidates";
  const existingTable = db
    .prepare(
      `
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name = ?
      `,
    )
    .get(tableName);
  const indexNames = [
    "idx_autohunt_work_queue_candidates_scope_created",
    "idx_autohunt_work_queue_candidates_source_grant_id_created",
    "idx_autohunt_work_queue_candidates_source_grant_fingerprint_created",
    "idx_autohunt_work_queue_candidates_candidate_status_created",
    "idx_autohunt_work_queue_candidates_candidate_origin_created",
    "idx_autohunt_work_queue_candidates_work_class_created",
  ];
  const existingIndexes = new Set(
    db
      .prepare(
        `
          SELECT name
          FROM sqlite_master
          WHERE type = 'index'
            AND name IN (${indexNames.map(() => "?").join(", ")})
        `,
      )
      .all(...indexNames)
      .map((index) => index.name),
  );

  db.exec(`
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
  `);

  return {
    table_found: true,
    created_tables: existingTable ? [] : [tableName],
    created_indexes: indexNames.filter((indexName) => !existingIndexes.has(indexName)),
  };
}

export function migrateAutohuntPreflightPackets(db) {
  const tableName = "autohunt_preflight_packets";
  const existingTable = db
    .prepare(
      `
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name = ?
      `,
    )
    .get(tableName);
  const indexNames = [
    "idx_autohunt_preflight_packets_scope_created",
    "idx_autohunt_preflight_packets_source_grant_id_created",
    "idx_autohunt_preflight_packets_source_grant_fingerprint_created",
    "idx_autohunt_preflight_packets_preflight_status_created",
  ];
  const existingIndexes = new Set(
    db
      .prepare(
        `
          SELECT name
          FROM sqlite_master
          WHERE type = 'index'
            AND name IN (${indexNames.map(() => "?").join(", ")})
        `,
      )
      .all(...indexNames)
      .map((index) => index.name),
  );

  db.exec(`
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
  `);

  return {
    table_found: true,
    created_tables: existingTable ? [] : [tableName],
    created_indexes: indexNames.filter((indexName) => !existingIndexes.has(indexName)),
  };
}

export function migrateAutohuntHandoffPlanPreviews(db) {
  const tableName = "autohunt_handoff_plan_previews";
  const existingTable = db
    .prepare(
      `
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name = ?
      `,
    )
    .get(tableName);
  const indexNames = [
    "idx_autohunt_handoff_plan_previews_scope_created",
    "idx_autohunt_handoff_plan_previews_source_grant_id_created",
    "idx_autohunt_handoff_plan_previews_source_preflight_packet_id_created",
    "idx_autohunt_handoff_plan_previews_handoff_plan_status_created",
  ];
  const existingIndexes = new Set(
    db
      .prepare(
        `
          SELECT name
          FROM sqlite_master
          WHERE type = 'index'
            AND name IN (${indexNames.map(() => "?").join(", ")})
        `,
      )
      .all(...indexNames)
      .map((index) => index.name),
  );

  db.exec(`
    CREATE TABLE IF NOT EXISTS autohunt_handoff_plan_previews (
      handoff_plan_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
      handoff_plan_status TEXT NOT NULL,
      source_grant_id TEXT NOT NULL,
      source_grant_fingerprint TEXT NOT NULL,
      source_grant_status TEXT NOT NULL,
      source_grant_mode TEXT NOT NULL,
      source_preflight_packet_id TEXT NOT NULL,
      source_preflight_packet_fingerprint TEXT NOT NULL,
      source_workbench_spine_fingerprint TEXT NOT NULL,
      selected_candidate_ids_json TEXT NOT NULL,
      selected_candidate_fingerprints_json TEXT NOT NULL,
      idempotency_key TEXT NOT NULL UNIQUE,
      selected_candidate_plan_summaries_json TEXT NOT NULL,
      supervised_codex_prompt_plan_json TEXT NOT NULL,
      draft_pr_plan_json TEXT NOT NULL,
      operator_review_packet_json TEXT NOT NULL,
      aggregate_budget_projection_json TEXT NOT NULL,
      blocked_actions_json TEXT NOT NULL,
      next_allowed_outputs_json TEXT NOT NULL,
      forbidden_outputs_json TEXT NOT NULL,
      authority_boundary_json TEXT NOT NULL,
      persisted_material_boundary_json TEXT NOT NULL,
      validation_json TEXT NOT NULL,
      row_count_write_summary_json TEXT NOT NULL,
      handoff_plan_fingerprint TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_autohunt_handoff_plan_previews_scope_created
      ON autohunt_handoff_plan_previews(scope, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_handoff_plan_previews_source_grant_id_created
      ON autohunt_handoff_plan_previews(source_grant_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_handoff_plan_previews_source_preflight_packet_id_created
      ON autohunt_handoff_plan_previews(source_preflight_packet_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_handoff_plan_previews_handoff_plan_status_created
      ON autohunt_handoff_plan_previews(handoff_plan_status, created_at DESC);
  `);

  return {
    table_found: true,
    created_tables: existingTable ? [] : [tableName],
    created_indexes: indexNames.filter((indexName) => !existingIndexes.has(indexName)),
  };
}

export function migrateAutohuntHandoffPlanOperatorReviewDecisions(db) {
  const tableName = "autohunt_handoff_plan_operator_review_decisions";
  const existingTable = db
    .prepare(
      `
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name = ?
      `,
    )
    .get(tableName);
  const indexNames = [
    "idx_autohunt_handoff_plan_operator_review_decisions_scope_created",
    "idx_autohunt_handoff_plan_operator_review_decisions_source_handoff_plan_id_created",
    "idx_autohunt_handoff_plan_operator_review_decisions_decision_status_created",
    "idx_autohunt_handoff_plan_operator_review_decisions_operator_decision_created",
  ];
  const existingIndexes = new Set(
    db
      .prepare(
        `
          SELECT name
          FROM sqlite_master
          WHERE type = 'index'
            AND name IN (${indexNames.map(() => "?").join(", ")})
        `,
      )
      .all(...indexNames)
      .map((index) => index.name),
  );

  db.exec(`
    CREATE TABLE IF NOT EXISTS autohunt_handoff_plan_operator_review_decisions (
      decision_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
      decision_status TEXT NOT NULL,
      operator_decision TEXT NOT NULL,
      source_handoff_plan_id TEXT NOT NULL,
      source_handoff_plan_fingerprint TEXT NOT NULL,
      source_handoff_plan_status TEXT NOT NULL,
      source_grant_id TEXT NOT NULL,
      source_grant_fingerprint TEXT NOT NULL,
      source_preflight_packet_id TEXT NOT NULL,
      source_preflight_packet_fingerprint TEXT NOT NULL,
      source_workbench_spine_fingerprint TEXT NOT NULL,
      selected_candidate_ids_json TEXT NOT NULL,
      selected_candidate_fingerprints_json TEXT NOT NULL,
      review_basis_ref TEXT NOT NULL,
      reviewed_by TEXT,
      reviewed_at TEXT,
      review_basis_fingerprint TEXT NOT NULL,
      idempotency_key TEXT NOT NULL UNIQUE,
      accepted_summary_json TEXT,
      defer_or_reject_summary_json TEXT,
      source_chain_validation_json TEXT NOT NULL,
      blocked_actions_json TEXT NOT NULL,
      next_allowed_outputs_json TEXT NOT NULL,
      forbidden_outputs_json TEXT NOT NULL,
      authority_boundary_json TEXT NOT NULL,
      persisted_material_boundary_json TEXT NOT NULL,
      validation_json TEXT NOT NULL,
      row_count_write_summary_json TEXT NOT NULL,
      decision_fingerprint TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_autohunt_handoff_plan_operator_review_decisions_scope_created
      ON autohunt_handoff_plan_operator_review_decisions(scope, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_handoff_plan_operator_review_decisions_source_handoff_plan_id_created
      ON autohunt_handoff_plan_operator_review_decisions(source_handoff_plan_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_handoff_plan_operator_review_decisions_decision_status_created
      ON autohunt_handoff_plan_operator_review_decisions(decision_status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_handoff_plan_operator_review_decisions_operator_decision_created
      ON autohunt_handoff_plan_operator_review_decisions(operator_decision, created_at DESC);
  `);

  return {
    table_found: true,
    created_tables: existingTable ? [] : [tableName],
    created_indexes: indexNames.filter((indexName) => !existingIndexes.has(indexName)),
  };
}

export function migrateAutohuntSupervisedExecutionContracts(db) {
  const tableName = "autohunt_supervised_execution_contracts";
  const existingTable = db
    .prepare(
      `
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name = ?
      `,
    )
    .get(tableName);
  const indexNames = [
    "idx_autohunt_supervised_execution_contracts_scope_created",
    "idx_autohunt_supervised_execution_contracts_contract_status_created",
    "idx_autohunt_supervised_execution_contracts_source_readiness_gate_fingerprint_created",
    "idx_autohunt_supervised_execution_contracts_active_grant_fingerprint_created",
    "idx_autohunt_supervised_execution_contracts_ready_preflight_packet_fingerprint_created",
    "idx_autohunt_supervised_execution_contracts_operator_decision_fingerprint_created",
  ];
  const existingIndexes = new Set(
    db
      .prepare(
        `
          SELECT name
          FROM sqlite_master
          WHERE type = 'index'
            AND name IN (${indexNames.map(() => "?").join(", ")})
        `,
      )
      .all(...indexNames)
      .map((index) => index.name),
  );

  db.exec(`
    CREATE TABLE IF NOT EXISTS autohunt_supervised_execution_contracts (
      contract_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
      contract_status TEXT NOT NULL,
      source_readiness_gate_fingerprint TEXT NOT NULL,
      active_grant_id TEXT NOT NULL,
      active_grant_fingerprint TEXT NOT NULL,
      latest_queued_candidate_id TEXT NOT NULL,
      latest_queued_candidate_fingerprint TEXT NOT NULL,
      ready_preflight_packet_id TEXT NOT NULL,
      ready_preflight_packet_fingerprint TEXT NOT NULL,
      handoff_plan_id TEXT NOT NULL,
      handoff_plan_fingerprint TEXT NOT NULL,
      operator_decision_id TEXT NOT NULL,
      operator_decision_fingerprint TEXT NOT NULL,
      copy_export_preview_fingerprint TEXT NOT NULL,
      launch_mode TEXT NOT NULL,
      idempotency_key TEXT NOT NULL UNIQUE,
      freshness_contract_json TEXT NOT NULL,
      launch_envelope_json TEXT NOT NULL,
      launcher_may_json TEXT NOT NULL,
      launcher_must_not_json TEXT NOT NULL,
      launch_guard_checks_json TEXT NOT NULL,
      launch_guard_result_json TEXT NOT NULL,
      authority_boundary_json TEXT NOT NULL,
      persisted_material_boundary_json TEXT NOT NULL,
      validation_json TEXT NOT NULL,
      row_count_write_summary_json TEXT NOT NULL,
      contract_fingerprint TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_autohunt_supervised_execution_contracts_scope_created
      ON autohunt_supervised_execution_contracts(scope, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_supervised_execution_contracts_contract_status_created
      ON autohunt_supervised_execution_contracts(contract_status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_supervised_execution_contracts_source_readiness_gate_fingerprint_created
      ON autohunt_supervised_execution_contracts(source_readiness_gate_fingerprint, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_supervised_execution_contracts_active_grant_fingerprint_created
      ON autohunt_supervised_execution_contracts(active_grant_fingerprint, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_supervised_execution_contracts_ready_preflight_packet_fingerprint_created
      ON autohunt_supervised_execution_contracts(ready_preflight_packet_fingerprint, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_supervised_execution_contracts_operator_decision_fingerprint_created
      ON autohunt_supervised_execution_contracts(operator_decision_fingerprint, created_at DESC);
  `);

  return {
    table_found: true,
    created_tables: existingTable ? [] : [tableName],
    created_indexes: indexNames.filter((indexName) => !existingIndexes.has(indexName)),
  };
}

export function migrateAutohuntResultIntakes(db) {
  const tableName = "autohunt_result_intakes";
  const existingTable = db
    .prepare(
      `
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name = ?
      `,
    )
    .get(tableName);
  const indexNames = [
    "idx_autohunt_result_intakes_scope_created",
    "idx_autohunt_result_intakes_source_execution_contract_id_created",
    "idx_autohunt_result_intakes_source_execution_contract_fingerprint_created",
    "idx_autohunt_result_intakes_result_intake_status_created",
    "idx_autohunt_result_intakes_result_report_fingerprint_created",
  ];
  const existingIndexes = new Set(
    db
      .prepare(
        `
          SELECT name
          FROM sqlite_master
          WHERE type = 'index'
            AND name IN (${indexNames.map(() => "?").join(", ")})
        `,
      )
      .all(...indexNames)
      .map((index) => index.name),
  );

  db.exec(`
    CREATE TABLE IF NOT EXISTS autohunt_result_intakes (
      result_intake_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
      result_intake_status TEXT NOT NULL,
      source_execution_contract_id TEXT NOT NULL,
      source_execution_contract_fingerprint TEXT NOT NULL,
      source_execution_contract_status TEXT NOT NULL,
      source_readiness_gate_fingerprint TEXT NOT NULL,
      active_grant_id TEXT NOT NULL,
      active_grant_fingerprint TEXT NOT NULL,
      ready_preflight_packet_id TEXT NOT NULL,
      ready_preflight_packet_fingerprint TEXT NOT NULL,
      operator_decision_id TEXT NOT NULL,
      operator_decision_fingerprint TEXT NOT NULL,
      copy_export_preview_fingerprint TEXT NOT NULL,
      result_report_id TEXT NOT NULL,
      result_report_fingerprint TEXT NOT NULL,
      result_status TEXT NOT NULL,
      idempotency_key TEXT NOT NULL UNIQUE,
      structured_result_report_json TEXT NOT NULL,
      expected_observed_delta_candidate_json TEXT NOT NULL,
      reuse_outcome_candidate_json TEXT NOT NULL,
      residual_diagnostic_candidate_json TEXT NOT NULL,
      learning_loop_summary_json TEXT NOT NULL,
      authority_boundary_json TEXT NOT NULL,
      persisted_material_boundary_json TEXT NOT NULL,
      validation_json TEXT NOT NULL,
      row_count_write_summary_json TEXT NOT NULL,
      result_intake_fingerprint TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_autohunt_result_intakes_scope_created
      ON autohunt_result_intakes(scope, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_result_intakes_source_execution_contract_id_created
      ON autohunt_result_intakes(source_execution_contract_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_result_intakes_source_execution_contract_fingerprint_created
      ON autohunt_result_intakes(source_execution_contract_fingerprint, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_result_intakes_result_intake_status_created
      ON autohunt_result_intakes(result_intake_status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_result_intakes_result_report_fingerprint_created
      ON autohunt_result_intakes(result_report_fingerprint, created_at DESC);
  `);

  return {
    table_found: true,
    created_tables: existingTable ? [] : [tableName],
    created_indexes: indexNames.filter((indexName) => !existingIndexes.has(indexName)),
  };
}

export function migrateAutohuntDailyLauncherRuns(db) {
  const tableName = "autohunt_daily_launcher_runs";
  const existingTable = db
    .prepare(
      `
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name = ?
      `,
    )
    .get(tableName);
  const indexNames = [
    "idx_autohunt_daily_launcher_runs_scope_created",
    "idx_autohunt_daily_launcher_runs_source_execution_contract_id_created",
    "idx_autohunt_daily_launcher_runs_source_execution_contract_fingerprint_created",
    "idx_autohunt_daily_launcher_runs_launcher_run_status_created",
    "idx_autohunt_daily_launcher_runs_handoff_packet_fingerprint_created",
    "idx_autohunt_daily_launcher_runs_confirmation_fingerprint_created",
  ];
  const existingIndexes = new Set(
    db
      .prepare(
        `
          SELECT name
          FROM sqlite_master
          WHERE type = 'index'
            AND name IN (${indexNames.map(() => "?").join(", ")})
        `,
      )
      .all(...indexNames)
      .map((index) => index.name),
  );

  db.exec(`
    CREATE TABLE IF NOT EXISTS autohunt_daily_launcher_runs (
      launcher_run_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
      launcher_run_status TEXT NOT NULL,
      source_execution_contract_id TEXT NOT NULL,
      source_execution_contract_fingerprint TEXT NOT NULL,
      source_execution_contract_status TEXT NOT NULL,
      launch_mode TEXT NOT NULL,
      active_grant_id TEXT NOT NULL,
      active_grant_fingerprint TEXT NOT NULL,
      ready_preflight_packet_id TEXT NOT NULL,
      ready_preflight_packet_fingerprint TEXT NOT NULL,
      operator_decision_id TEXT NOT NULL,
      operator_decision_fingerprint TEXT NOT NULL,
      copy_export_preview_fingerprint TEXT NOT NULL,
      confirmation_ref TEXT NOT NULL,
      confirmed_by TEXT,
      confirmed_at TEXT,
      confirmation_fingerprint TEXT NOT NULL,
      handoff_packet_id TEXT NOT NULL,
      handoff_packet_fingerprint TEXT NOT NULL,
      idempotency_key TEXT NOT NULL UNIQUE,
      handoff_packet_json TEXT NOT NULL,
      launcher_run_boundary_json TEXT NOT NULL,
      structured_result_report_fixture_json TEXT,
      linked_result_intake_json TEXT,
      authority_boundary_json TEXT NOT NULL,
      persisted_material_boundary_json TEXT NOT NULL,
      validation_json TEXT NOT NULL,
      row_count_write_summary_json TEXT NOT NULL,
      launcher_run_fingerprint TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_autohunt_daily_launcher_runs_scope_created
      ON autohunt_daily_launcher_runs(scope, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_daily_launcher_runs_source_execution_contract_id_created
      ON autohunt_daily_launcher_runs(source_execution_contract_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_daily_launcher_runs_source_execution_contract_fingerprint_created
      ON autohunt_daily_launcher_runs(source_execution_contract_fingerprint, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_daily_launcher_runs_launcher_run_status_created
      ON autohunt_daily_launcher_runs(launcher_run_status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_daily_launcher_runs_handoff_packet_fingerprint_created
      ON autohunt_daily_launcher_runs(handoff_packet_fingerprint, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_daily_launcher_runs_confirmation_fingerprint_created
      ON autohunt_daily_launcher_runs(confirmation_fingerprint, created_at DESC);
  `);

  return {
    table_found: true,
    created_tables: existingTable ? [] : [tableName],
    created_indexes: indexNames.filter((indexName) => !existingIndexes.has(indexName)),
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

export const vNextProjectIdentityRegistrySchemaSqlV01 = `
  CREATE TABLE IF NOT EXISTS vnext_workspace_identities (
    workspace_id TEXT PRIMARY KEY CHECK (
      length(workspace_id) <= 256 AND
      workspace_id GLOB 'workspace:*' AND
      length(substr(workspace_id, 11)) > 0
    ),
    workspace_identity_version TEXT NOT NULL CHECK (
      workspace_identity_version = 'workspace_identity.v0.1'
    ),
    identity_kind TEXT NOT NULL CHECK (identity_kind = 'canonical'),
    identity_source TEXT NOT NULL CHECK (identity_source = 'canonical_registry'),
    workspace_role TEXT NOT NULL UNIQUE CHECK (
      length(trim(workspace_role)) > 0 AND length(workspace_role) <= 128
    ),
    created_at TEXT NOT NULL CHECK (length(trim(created_at)) > 0)
  );

  CREATE TABLE IF NOT EXISTS vnext_project_identities (
    workspace_id TEXT NOT NULL,
    project_id TEXT NOT NULL CHECK (
      length(project_id) <= 256 AND
      project_id GLOB 'project:*' AND
      project_id <> 'project:augnes' AND
      length(substr(project_id, 9)) > 0
    ),
    project_identity_version TEXT NOT NULL CHECK (
      project_identity_version = 'project_identity.v0.1'
    ),
    identity_kind TEXT NOT NULL CHECK (identity_kind = 'canonical'),
    identity_source TEXT NOT NULL CHECK (identity_source = 'canonical_registry'),
    display_name TEXT CHECK (
      display_name IS NULL OR
      (length(trim(display_name)) > 0 AND length(display_name) <= 240)
    ),
    created_at TEXT NOT NULL CHECK (length(trim(created_at)) > 0),
    PRIMARY KEY (workspace_id, project_id),
    FOREIGN KEY (workspace_id)
      REFERENCES vnext_workspace_identities(workspace_id)
      ON UPDATE RESTRICT ON DELETE RESTRICT
  );

  CREATE INDEX IF NOT EXISTS idx_vnext_project_identities_workspace_created
    ON vnext_project_identities(workspace_id, created_at, project_id);

  CREATE TABLE IF NOT EXISTS vnext_project_root_bindings (
    workspace_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    binding_version TEXT NOT NULL CHECK (
      binding_version = 'project_local_root_binding.v0.1'
    ),
    local_root_ref_version TEXT NOT NULL CHECK (
      local_root_ref_version = 'local_project_root_ref.v0.1'
    ),
    ref_kind TEXT NOT NULL CHECK (ref_kind = 'local_project_root'),
    path_flavor TEXT NOT NULL CHECK (path_flavor IN ('posix', 'win32')),
    normalized_root TEXT NOT NULL CHECK (
      length(normalized_root) > 0 AND
      length(normalized_root) <= 8192 AND
      instr(normalized_root, char(0)) = 0
    ),
    bound_at TEXT NOT NULL CHECK (length(trim(bound_at)) > 0),
    PRIMARY KEY (workspace_id, project_id),
    FOREIGN KEY (workspace_id, project_id)
      REFERENCES vnext_project_identities(workspace_id, project_id)
      ON UPDATE RESTRICT ON DELETE RESTRICT
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_vnext_project_root_bindings_workspace_root
    ON vnext_project_root_bindings(workspace_id, path_flavor, normalized_root);

  CREATE TABLE IF NOT EXISTS vnext_project_external_ref_bindings (
    workspace_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    binding_version TEXT NOT NULL CHECK (
      binding_version = 'project_external_ref_binding.v0.1'
    ),
    ref_fingerprint TEXT NOT NULL CHECK (
      length(ref_fingerprint) = 71 AND substr(ref_fingerprint, 1, 7) = 'sha256:'
    ),
    ref_json TEXT NOT NULL CHECK (
      json_valid(ref_json) AND json_type(ref_json) = 'object'
    ),
    created_at TEXT NOT NULL CHECK (length(trim(created_at)) > 0),
    PRIMARY KEY (workspace_id, project_id, ref_fingerprint),
    FOREIGN KEY (workspace_id, project_id)
      REFERENCES vnext_project_identities(workspace_id, project_id)
      ON UPDATE RESTRICT ON DELETE RESTRICT
  );

  CREATE INDEX IF NOT EXISTS idx_vnext_project_external_refs_project_created
    ON vnext_project_external_ref_bindings(
      workspace_id, project_id, created_at, ref_fingerprint
    );

  CREATE TRIGGER IF NOT EXISTS trg_vnext_project_external_refs_immutable_update
    BEFORE UPDATE ON vnext_project_external_ref_bindings
    BEGIN SELECT RAISE(ABORT, 'vnext_project_external_ref_binding_immutable'); END;
  CREATE TRIGGER IF NOT EXISTS trg_vnext_project_external_refs_immutable_delete
    BEFORE DELETE ON vnext_project_external_ref_bindings
    BEGIN SELECT RAISE(ABORT, 'vnext_project_external_ref_binding_immutable'); END;
`;

const vNextProjectIdentityRegistryArtifactsV01 = {
  tables: [
    "vnext_workspace_identities",
    "vnext_project_identities",
    "vnext_project_root_bindings",
    "vnext_project_external_ref_bindings",
  ],
  indexes: [
    "idx_vnext_project_identities_workspace_created",
    "idx_vnext_project_root_bindings_workspace_root",
    "idx_vnext_project_external_refs_project_created",
  ],
  triggers: [
    "trg_vnext_project_external_refs_immutable_update",
    "trg_vnext_project_external_refs_immutable_delete",
  ],
};

export function migrateVNextProjectIdentityRegistryV01(db) {
  const names = Object.values(vNextProjectIdentityRegistryArtifactsV01).flat();
  const before = new Set(
    db
      .prepare(
        `SELECT type || ':' || name AS key
         FROM sqlite_master
         WHERE name IN (${names.map(() => "?").join(", ")})`,
      )
      .all(...names)
      .map((row) => row.key),
  );
  db.exec(vNextProjectIdentityRegistrySchemaSqlV01);
  const created = (type, artifactNames) =>
    artifactNames.filter((name) => !before.has(`${type}:${name}`));
  return {
    created_tables: created(
      "table",
      vNextProjectIdentityRegistryArtifactsV01.tables,
    ),
    created_indexes: created(
      "index",
      vNextProjectIdentityRegistryArtifactsV01.indexes,
    ),
    created_triggers: created(
      "trigger",
      vNextProjectIdentityRegistryArtifactsV01.triggers,
    ),
  };
}

export const vNextRepositoryExecutionStoreSchemaSqlV01 = `
  CREATE TABLE IF NOT EXISTS vnext_physical_root_baselines (
    workspace_id TEXT NOT NULL, project_id TEXT NOT NULL,
    node_scope_fingerprint TEXT NOT NULL CHECK (length(node_scope_fingerprint) = 71 AND substr(node_scope_fingerprint, 1, 7) = 'sha256:'),
    baseline_version TEXT NOT NULL CHECK (baseline_version = 'physical_root_baseline.v0.1'),
    root_binding_fingerprint TEXT NOT NULL CHECK (length(root_binding_fingerprint) = 71 AND substr(root_binding_fingerprint, 1, 7) = 'sha256:'),
    identity_version TEXT NOT NULL CHECK (identity_version IN ('native_host_physical_root_identity.v0.1', 'physical_root_identity.windows.v0.1')),
    identity_platform TEXT CHECK (identity_platform IS NULL OR identity_platform = 'win32'),
    canonical_realpath_fingerprint TEXT CHECK (canonical_realpath_fingerprint IS NULL OR (length(canonical_realpath_fingerprint) = 71 AND substr(canonical_realpath_fingerprint, 1, 7) = 'sha256:')),
    canonical_final_path_fingerprint TEXT CHECK (canonical_final_path_fingerprint IS NULL OR (length(canonical_final_path_fingerprint) = 71 AND substr(canonical_final_path_fingerprint, 1, 7) = 'sha256:')),
    supported_filesystem_family TEXT CHECK (supported_filesystem_family IS NULL OR supported_filesystem_family = 'NTFS'),
    filesystem_volume_identity TEXT NOT NULL CHECK (length(filesystem_volume_identity) > 0),
    filesystem_object_identity TEXT NOT NULL CHECK (length(filesystem_object_identity) > 0),
    observed_at TEXT NOT NULL CHECK (length(trim(observed_at)) > 0),
    provenance TEXT NOT NULL CHECK (provenance IN ('canonical_new_project_onboarding', 'explicit_legacy_adoption', 'explicit_root_rebind')),
    baseline_fingerprint TEXT NOT NULL UNIQUE CHECK (length(baseline_fingerprint) = 71 AND substr(baseline_fingerprint, 1, 7) = 'sha256:'),
    CHECK ((identity_version = 'native_host_physical_root_identity.v0.1' AND identity_platform IS NULL AND canonical_realpath_fingerprint IS NOT NULL AND canonical_final_path_fingerprint IS NULL AND supported_filesystem_family IS NULL) OR (identity_version = 'physical_root_identity.windows.v0.1' AND identity_platform = 'win32' AND canonical_realpath_fingerprint IS NULL AND canonical_final_path_fingerprint IS NOT NULL AND supported_filesystem_family = 'NTFS')),
    PRIMARY KEY (workspace_id, project_id, node_scope_fingerprint),
    FOREIGN KEY (workspace_id, project_id) REFERENCES vnext_project_identities(workspace_id, project_id) ON UPDATE RESTRICT ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_vnext_physical_root_baselines_project
    ON vnext_physical_root_baselines(workspace_id, project_id, observed_at);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_vnext_physical_root_baselines_object
    ON vnext_physical_root_baselines(workspace_id, node_scope_fingerprint, identity_version, filesystem_volume_identity, filesystem_object_identity)
    WHERE identity_version = 'physical_root_identity.windows.v0.1';
  CREATE TABLE IF NOT EXISTS vnext_repository_execution_attachments (
    attachment_id TEXT PRIMARY KEY CHECK (length(attachment_id) = 71 AND substr(attachment_id, 1, 7) = 'sha256:'),
    attachment_version TEXT NOT NULL CHECK (attachment_version = 'repository_execution_attachment.v0.1'),
    workspace_id TEXT NOT NULL, project_id TEXT NOT NULL,
    node_scope_fingerprint TEXT NOT NULL CHECK (length(node_scope_fingerprint) = 71),
    physical_root_baseline_fingerprint TEXT NOT NULL CHECK (length(physical_root_baseline_fingerprint) = 71),
    root_binding_fingerprint TEXT NOT NULL CHECK (length(root_binding_fingerprint) = 71),
    task_context_packet_id TEXT NOT NULL,
    task_context_packet_fingerprint TEXT NOT NULL CHECK (length(task_context_packet_fingerprint) = 71),
    current_work_fingerprint TEXT NOT NULL CHECK (length(current_work_fingerprint) = 71),
    project_execution_admission_fingerprint TEXT NOT NULL CHECK (length(project_execution_admission_fingerprint) = 71),
    worktree_observation_fingerprint TEXT NOT NULL CHECK (length(worktree_observation_fingerprint) = 71),
    managed_run_state_fingerprint TEXT NOT NULL CHECK (length(managed_run_state_fingerprint) = 71),
    binding_fingerprint TEXT NOT NULL UNIQUE CHECK (length(binding_fingerprint) = 71),
    prepared_at TEXT NOT NULL CHECK (length(trim(prepared_at)) > 0),
    freshness_policy_json TEXT NOT NULL CHECK (json_valid(freshness_policy_json) AND json_type(freshness_policy_json) = 'object'),
    lifecycle TEXT NOT NULL CHECK (lifecycle IN ('prepared', 'stale', 'superseded', 'revoked', 'consumed')),
    stale_reason TEXT CHECK (stale_reason IS NULL OR stale_reason IN ('physical_root_mismatch', 'root_binding_changed', 'packet_changed', 'current_work_changed', 'project_unavailable', 'managed_run_conflict', 'worktree_changed', 'freshness_expired', 'explicitly_revoked', 'superseded')),
    lifecycle_updated_at TEXT NOT NULL CHECK (length(trim(lifecycle_updated_at)) > 0),
    consumed_run_id TEXT,
    CHECK ((lifecycle = 'consumed' AND consumed_run_id IS NOT NULL AND length(trim(consumed_run_id)) > 0) OR (lifecycle <> 'consumed' AND consumed_run_id IS NULL)),
    FOREIGN KEY (workspace_id, project_id) REFERENCES vnext_project_identities(workspace_id, project_id) ON UPDATE RESTRICT ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_vnext_repository_execution_attachments_project
    ON vnext_repository_execution_attachments(workspace_id, project_id, lifecycle_updated_at DESC, attachment_id);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_vnext_repository_execution_one_prepared
    ON vnext_repository_execution_attachments(workspace_id, project_id) WHERE lifecycle = 'prepared';
  CREATE UNIQUE INDEX IF NOT EXISTS idx_vnext_repository_execution_consumed_run
    ON vnext_repository_execution_attachments(consumed_run_id) WHERE consumed_run_id IS NOT NULL;
  CREATE TABLE IF NOT EXISTS vnext_repository_run_resume_checkpoints (
    checkpoint_fingerprint TEXT PRIMARY KEY CHECK (length(checkpoint_fingerprint) = 71 AND substr(checkpoint_fingerprint, 1, 7) = 'sha256:'),
    checkpoint_version TEXT NOT NULL CHECK (checkpoint_version = 'repository_run_resume_checkpoint.v0.1'),
    workspace_id TEXT NOT NULL, project_id TEXT NOT NULL, run_id TEXT NOT NULL,
    invocation_origin TEXT NOT NULL CHECK (invocation_origin = 'repository_attachment'),
    attachment_id TEXT NOT NULL,
    attachment_binding_fingerprint TEXT NOT NULL CHECK (length(attachment_binding_fingerprint) = 71),
    node_scope_fingerprint TEXT NOT NULL CHECK (length(node_scope_fingerprint) = 71),
    execution_envelope_version TEXT NOT NULL CHECK (execution_envelope_version = 'repository_execution_envelope.v0.1'),
    execution_envelope_fingerprint TEXT NOT NULL CHECK (length(execution_envelope_fingerprint) = 71),
    adapter_version TEXT NOT NULL CHECK (length(adapter_version) BETWEEN 1 AND 160),
    capability_version TEXT NOT NULL CHECK (length(capability_version) BETWEEN 1 AND 160),
    provider_resume_binding_version TEXT NOT NULL CHECK (provider_resume_binding_version = 'native_host_resume_binding.v0.1'),
    provider_thread_ref_json TEXT NOT NULL CHECK (json_valid(provider_thread_ref_json) AND json_type(provider_thread_ref_json) = 'object'),
    last_turn_ref_json TEXT NOT NULL CHECK (json_valid(last_turn_ref_json) AND json_type(last_turn_ref_json) = 'object'),
    controller_generation INTEGER NOT NULL CHECK (controller_generation >= 1),
    runtime_instance_fingerprint TEXT NOT NULL CHECK (length(runtime_instance_fingerprint) = 71),
    runtime_generation_fingerprint TEXT NOT NULL CHECK (length(runtime_generation_fingerprint) = 71),
    run_control_revision INTEGER NOT NULL CHECK (run_control_revision >= 0),
    step_id TEXT NOT NULL CHECK (length(trim(step_id)) > 0),
    step_control_revision INTEGER NOT NULL CHECK (step_control_revision >= 0),
    event_high_water_mark INTEGER NOT NULL CHECK (event_high_water_mark >= 0),
    step_high_water_mark INTEGER NOT NULL CHECK (step_high_water_mark >= 0),
    effect_ledger_high_water_mark INTEGER NOT NULL CHECK (effect_ledger_high_water_mark >= 0),
    operation_ref TEXT NOT NULL CHECK (length(operation_ref) = 71 AND substr(operation_ref, 1, 7) = 'sha256:'),
    operation_class TEXT NOT NULL CHECK (operation_class IN ('command_execution', 'file_change')),
    checkpoint_phase TEXT NOT NULL CHECK (checkpoint_phase IN ('declared_pre_start', 'post_operation')),
    operation_certainty TEXT NOT NULL CHECK (operation_certainty IN ('not_started', 'started', 'completed', 'failed', 'cancelled', 'waiting_for_approval')),
    approval_ref TEXT,
    approval_state TEXT CHECK (approval_state IS NULL OR approval_state IN ('pending', 'decided', 'expired')),
    root_binding_fingerprint TEXT NOT NULL CHECK (length(root_binding_fingerprint) = 71),
    physical_root_baseline_fingerprint TEXT NOT NULL CHECK (length(physical_root_baseline_fingerprint) = 71),
    worktree_observation_fingerprint TEXT NOT NULL CHECK (length(worktree_observation_fingerprint) = 71),
    observed_at TEXT NOT NULL CHECK (length(trim(observed_at)) > 0),
    CHECK ((approval_ref IS NULL AND approval_state IS NULL) OR (approval_ref IS NOT NULL AND approval_state IS NOT NULL)),
    FOREIGN KEY (workspace_id, project_id) REFERENCES vnext_project_identities(workspace_id, project_id) ON UPDATE RESTRICT ON DELETE CASCADE,
    FOREIGN KEY (run_id) REFERENCES autonomy_runs(run_id) ON DELETE CASCADE,
    FOREIGN KEY (attachment_id) REFERENCES vnext_repository_execution_attachments(attachment_id) ON UPDATE RESTRICT ON DELETE CASCADE
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_vnext_repository_resume_checkpoint_operation
    ON vnext_repository_run_resume_checkpoints(run_id, operation_ref, checkpoint_phase);
  CREATE INDEX IF NOT EXISTS idx_vnext_repository_resume_checkpoint_current
    ON vnext_repository_run_resume_checkpoints(workspace_id, project_id, run_id, effect_ledger_high_water_mark DESC, event_high_water_mark DESC, checkpoint_fingerprint);
  CREATE TABLE IF NOT EXISTS vnext_repository_managed_resume_attempts (
    attempt_fingerprint TEXT PRIMARY KEY CHECK (length(attempt_fingerprint) = 71 AND substr(attempt_fingerprint, 1, 7) = 'sha256:'),
    attempt_version TEXT NOT NULL CHECK (attempt_version = 'repository_managed_resume_attempt.v0.1'),
    workspace_id TEXT NOT NULL, project_id TEXT NOT NULL, run_id TEXT NOT NULL,
    attachment_id TEXT NOT NULL,
    attachment_binding_fingerprint TEXT NOT NULL CHECK (length(attachment_binding_fingerprint) = 71),
    checkpoint_fingerprint TEXT NOT NULL,
    checkpoint_version TEXT NOT NULL CHECK (checkpoint_version = 'repository_run_resume_checkpoint.v0.1'),
    prior_controller_generation INTEGER NOT NULL CHECK (prior_controller_generation >= 1),
    resumed_controller_generation INTEGER NOT NULL CHECK (resumed_controller_generation = prior_controller_generation + 1),
    decision_request_fingerprint TEXT NOT NULL CHECK (length(decision_request_fingerprint) = 71),
    decision_grant_fingerprint TEXT NOT NULL CHECK (length(decision_grant_fingerprint) = 71),
    expected_state_fingerprint TEXT NOT NULL CHECK (length(expected_state_fingerprint) = 71),
    admitted_run_control_revision INTEGER NOT NULL CHECK (admitted_run_control_revision >= 1),
    admitted_step_control_revision INTEGER NOT NULL CHECK (admitted_step_control_revision >= 1),
    runtime_instance_fingerprint TEXT NOT NULL CHECK (length(runtime_instance_fingerprint) = 71),
    runtime_generation_fingerprint TEXT NOT NULL CHECK (length(runtime_generation_fingerprint) = 71),
    attempt_state TEXT NOT NULL CHECK (attempt_state IN ('admitted_not_invoked', 'provider_resume_invocation_started', 'controller_owned', 'settled', 'reconciliation_required')),
    final_outcome TEXT CHECK (final_outcome IS NULL OR final_outcome IN ('completed', 'failed', 'cancelled', 'timed_out')),
    admitted_at TEXT NOT NULL CHECK (length(trim(admitted_at)) > 0),
    provider_invocation_started_at TEXT, settled_at TEXT,
    updated_at TEXT NOT NULL CHECK (length(trim(updated_at)) > 0),
    UNIQUE (run_id, checkpoint_fingerprint), UNIQUE (decision_request_fingerprint),
    FOREIGN KEY (workspace_id, project_id) REFERENCES vnext_project_identities(workspace_id, project_id) ON UPDATE RESTRICT ON DELETE CASCADE,
    FOREIGN KEY (run_id) REFERENCES autonomy_runs(run_id) ON DELETE CASCADE,
    FOREIGN KEY (attachment_id) REFERENCES vnext_repository_execution_attachments(attachment_id) ON UPDATE RESTRICT ON DELETE CASCADE,
    FOREIGN KEY (checkpoint_fingerprint) REFERENCES vnext_repository_run_resume_checkpoints(checkpoint_fingerprint) ON UPDATE RESTRICT ON DELETE CASCADE,
    FOREIGN KEY (decision_request_fingerprint) REFERENCES vnext_repository_execution_decision_requests(request_fingerprint) ON UPDATE RESTRICT ON DELETE RESTRICT
  );
  CREATE INDEX IF NOT EXISTS idx_vnext_repository_managed_resume_attempts_run
    ON vnext_repository_managed_resume_attempts(workspace_id, project_id, run_id, admitted_at DESC, attempt_fingerprint);
  CREATE TABLE IF NOT EXISTS vnext_repository_managed_resume_runtime_claims (
    attempt_fingerprint TEXT PRIMARY KEY,
    claim_version TEXT NOT NULL CHECK (claim_version = 'repository_managed_resume_runtime_claim.v0.1'),
    runtime_instance_fingerprint TEXT NOT NULL CHECK (length(runtime_instance_fingerprint) = 71),
    runtime_generation_fingerprint TEXT NOT NULL CHECK (length(runtime_generation_fingerprint) = 71),
    claim_revision INTEGER NOT NULL CHECK (claim_revision BETWEEN 1 AND 16),
    claim_lifecycle TEXT NOT NULL CHECK (claim_lifecycle IN ('claimed', 'invocation_started', 'released', 'cancelled')),
    claimed_at TEXT NOT NULL CHECK (length(trim(claimed_at)) > 0),
    updated_at TEXT NOT NULL CHECK (length(trim(updated_at)) > 0),
    FOREIGN KEY (attempt_fingerprint) REFERENCES vnext_repository_managed_resume_attempts(attempt_fingerprint) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS vnext_repository_managed_resume_runtime_claim_history (
    attempt_fingerprint TEXT NOT NULL,
    claim_revision INTEGER NOT NULL CHECK (claim_revision BETWEEN 1 AND 16),
    claim_version TEXT NOT NULL CHECK (claim_version = 'repository_managed_resume_runtime_claim.v0.1'),
    runtime_instance_fingerprint TEXT NOT NULL CHECK (length(runtime_instance_fingerprint) = 71),
    runtime_generation_fingerprint TEXT NOT NULL CHECK (length(runtime_generation_fingerprint) = 71),
    claimed_at TEXT NOT NULL CHECK (length(trim(claimed_at)) > 0),
    PRIMARY KEY (attempt_fingerprint, claim_revision),
    UNIQUE (attempt_fingerprint, runtime_instance_fingerprint, runtime_generation_fingerprint),
    FOREIGN KEY (attempt_fingerprint) REFERENCES vnext_repository_managed_resume_attempts(attempt_fingerprint) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS vnext_repository_managed_resume_cancellations (
    attempt_fingerprint TEXT PRIMARY KEY,
    cancellation_version TEXT NOT NULL CHECK (cancellation_version = 'repository_managed_resume_cancellation.v0.1'),
    workspace_id TEXT NOT NULL, project_id TEXT NOT NULL, run_id TEXT NOT NULL,
    attachment_id TEXT NOT NULL,
    controller_generation INTEGER NOT NULL CHECK (controller_generation >= 1),
    cancellation_requested_at TEXT NOT NULL CHECK (length(trim(cancellation_requested_at)) > 0),
    cancellation_control_revision INTEGER NOT NULL CHECK (cancellation_control_revision >= 1),
    provider_stop_confirmed INTEGER NOT NULL CHECK (provider_stop_confirmed IN (0, 1)),
    resume_reacquisition_forbidden INTEGER NOT NULL CHECK (resume_reacquisition_forbidden = 1),
    cancellation_signal_sent INTEGER NOT NULL CHECK (cancellation_signal_sent IN (0, 1)),
    updated_at TEXT NOT NULL CHECK (length(trim(updated_at)) > 0),
    FOREIGN KEY (attempt_fingerprint) REFERENCES vnext_repository_managed_resume_attempts(attempt_fingerprint) ON DELETE CASCADE,
    FOREIGN KEY (run_id) REFERENCES autonomy_runs(run_id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS vnext_repository_root_rebind_receipts (
    request_fingerprint TEXT PRIMARY KEY CHECK (length(request_fingerprint) = 71),
    workspace_id TEXT NOT NULL, project_id TEXT NOT NULL,
    old_root_binding_fingerprint TEXT NOT NULL CHECK (length(old_root_binding_fingerprint) = 71),
    old_baseline_fingerprint TEXT CHECK (old_baseline_fingerprint IS NULL OR length(old_baseline_fingerprint) = 71),
    new_root_binding_fingerprint TEXT NOT NULL CHECK (length(new_root_binding_fingerprint) = 71),
    new_baseline_fingerprint TEXT NOT NULL CHECK (length(new_baseline_fingerprint) = 71),
    recorded_at TEXT NOT NULL CHECK (length(trim(recorded_at)) > 0),
    FOREIGN KEY (workspace_id, project_id) REFERENCES vnext_project_identities(workspace_id, project_id) ON UPDATE RESTRICT ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_vnext_repository_root_rebind_receipts_project
    ON vnext_repository_root_rebind_receipts(workspace_id, project_id, recorded_at);
  CREATE TABLE IF NOT EXISTS vnext_repository_execution_decision_requests (
    request_fingerprint TEXT PRIMARY KEY CHECK (length(request_fingerprint) = 71 AND substr(request_fingerprint, 1, 7) = 'sha256:'),
    decision_request_version TEXT NOT NULL CHECK (decision_request_version = 'repository_execution_decision_request.v0.1'),
    action TEXT NOT NULL CHECK (action IN ('adopt_legacy_baseline', 'rebind_root', 'revoke_attachment', 'start_repository_managed_delegation', 'resume_repository_managed_delegation')),
    workspace_id TEXT NOT NULL, project_id TEXT NOT NULL,
    expected_state_fingerprint TEXT NOT NULL CHECK (length(expected_state_fingerprint) = 71),
    expected_state_json TEXT NOT NULL CHECK (json_valid(expected_state_json) AND json_type(expected_state_json) = 'object'),
    requested_at TEXT NOT NULL CHECK (length(trim(requested_at)) > 0),
    expires_at TEXT NOT NULL CHECK (length(trim(expires_at)) > 0),
    status TEXT NOT NULL CHECK (status IN ('pending', 'granted', 'consumed', 'expired', 'superseded')),
    grant_fingerprint TEXT UNIQUE CHECK (grant_fingerprint IS NULL OR length(grant_fingerprint) = 71),
    confirmation_source TEXT CHECK (confirmation_source IS NULL OR confirmation_source = 'browser_same_origin_button'),
    granted_at TEXT, consumed_at TEXT,
    result_fingerprint TEXT CHECK (result_fingerprint IS NULL OR length(result_fingerprint) = 71),
    FOREIGN KEY (workspace_id, project_id) REFERENCES vnext_project_identities(workspace_id, project_id) ON UPDATE RESTRICT ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_vnext_repository_execution_decisions_project
    ON vnext_repository_execution_decision_requests(workspace_id, project_id, status, requested_at DESC);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_vnext_repository_execution_one_open_decision
    ON vnext_repository_execution_decision_requests(workspace_id, project_id, action)
    WHERE status IN ('pending', 'granted');
`;

export function migrateVNextRepositoryExecutionStoreV01(db) {
  const tableNames = [
    "vnext_physical_root_baselines",
    "vnext_repository_execution_attachments",
    "vnext_repository_run_resume_checkpoints",
    "vnext_repository_managed_resume_attempts",
    "vnext_repository_managed_resume_runtime_claims",
    "vnext_repository_managed_resume_runtime_claim_history",
    "vnext_repository_managed_resume_cancellations",
    "vnext_repository_root_rebind_receipts",
    "vnext_repository_execution_decision_requests",
  ];
  const indexNames = [
    "idx_vnext_physical_root_baselines_project",
    "idx_vnext_physical_root_baselines_object",
    "idx_vnext_repository_execution_attachments_project",
    "idx_vnext_repository_execution_one_prepared",
    "idx_vnext_repository_execution_consumed_run",
    "idx_vnext_repository_resume_checkpoint_operation",
    "idx_vnext_repository_resume_checkpoint_current",
    "idx_vnext_repository_managed_resume_attempts_run",
    "idx_vnext_repository_root_rebind_receipts_project",
    "idx_vnext_repository_execution_decisions_project",
    "idx_vnext_repository_execution_one_open_decision",
  ];
  const names = [...tableNames, ...indexNames];
  const before = new Set(db.prepare(
    `SELECT type || ':' || name AS key FROM sqlite_master WHERE name IN (${names.map(() => "?").join(", ")})`,
  ).all(...names).map((row) => row.key));
  const attachmentSql = db.prepare(
    "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'vnext_repository_execution_attachments'",
  ).pluck().get();
  const baselineSql = db.prepare(
    "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'vnext_physical_root_baselines'",
  ).pluck().get();
  const decisionSql = db.prepare(
    "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'vnext_repository_execution_decision_requests'",
  ).pluck().get();
  const attachmentUpgradeRequired =
    typeof attachmentSql === "string" &&
    !attachmentSql.includes("lifecycle = 'consumed' AND consumed_run_id IS NOT NULL");
  const baselineUpgradeRequired =
    typeof baselineSql === "string" &&
    !baselineSql.includes("physical_root_identity.windows.v0.1");
  const decisionUpgradeRequired =
    typeof decisionSql === "string" &&
    (!decisionSql.includes("start_repository_managed_delegation") ||
      !decisionSql.includes("resume_repository_managed_delegation"));
  if (baselineUpgradeRequired || attachmentUpgradeRequired || decisionUpgradeRequired) {
    if (
      attachmentUpgradeRequired &&
      db.prepare(
        "SELECT 1 FROM vnext_repository_execution_attachments WHERE lifecycle = 'consumed' LIMIT 1",
      ).get()
    ) {
      throw new Error("repository_execution_legacy_consumed_attachment_invalid");
    }
    db.exec("BEGIN IMMEDIATE");
    try {
      if (baselineUpgradeRequired) {
        db.exec(
          "ALTER TABLE vnext_physical_root_baselines RENAME TO vnext_physical_root_baselines_cdx2b3a",
        );
        // SQLite keeps index names when their table is renamed. Release the
        // canonical names before creating the replacement table so its
        // indexes cannot be skipped and then disappear with the old table.
        db.exec("DROP INDEX IF EXISTS idx_vnext_physical_root_baselines_project");
        db.exec("DROP INDEX IF EXISTS idx_vnext_physical_root_baselines_object");
      }
      if (attachmentUpgradeRequired) {
        db.exec(
          "ALTER TABLE vnext_repository_execution_attachments RENAME TO vnext_repository_execution_attachments_cdx2b2a",
        );
      }
      if (decisionUpgradeRequired) {
        db.exec(
          "ALTER TABLE vnext_repository_execution_decision_requests RENAME TO vnext_repository_execution_decision_requests_cdx2b2a",
        );
      }
      db.exec(vNextRepositoryExecutionStoreSchemaSqlV01);
      if (baselineUpgradeRequired) {
        db.exec(`INSERT INTO vnext_physical_root_baselines (
          workspace_id, project_id, node_scope_fingerprint, baseline_version,
          root_binding_fingerprint, identity_version, identity_platform,
          canonical_realpath_fingerprint, canonical_final_path_fingerprint,
          supported_filesystem_family, filesystem_volume_identity,
          filesystem_object_identity, observed_at, provenance,
          baseline_fingerprint
        ) SELECT
          workspace_id, project_id, node_scope_fingerprint, baseline_version,
          root_binding_fingerprint, identity_version, NULL,
          canonical_realpath_fingerprint, NULL, NULL,
          filesystem_volume_identity, filesystem_object_identity, observed_at,
          provenance, baseline_fingerprint
        FROM vnext_physical_root_baselines_cdx2b3a`);
        db.exec("DROP TABLE vnext_physical_root_baselines_cdx2b3a");
      }
      if (attachmentUpgradeRequired) {
        db.exec(`INSERT INTO vnext_repository_execution_attachments (
          attachment_id, attachment_version, workspace_id, project_id,
          node_scope_fingerprint, physical_root_baseline_fingerprint,
          root_binding_fingerprint, task_context_packet_id,
          task_context_packet_fingerprint, current_work_fingerprint,
          project_execution_admission_fingerprint, worktree_observation_fingerprint,
          managed_run_state_fingerprint, binding_fingerprint, prepared_at,
          freshness_policy_json, lifecycle, stale_reason, lifecycle_updated_at,
          consumed_run_id
        ) SELECT
          attachment_id, attachment_version, workspace_id, project_id,
          node_scope_fingerprint, physical_root_baseline_fingerprint,
          root_binding_fingerprint, task_context_packet_id,
          task_context_packet_fingerprint, current_work_fingerprint,
          project_execution_admission_fingerprint, worktree_observation_fingerprint,
          managed_run_state_fingerprint, binding_fingerprint, prepared_at,
          freshness_policy_json, lifecycle, stale_reason, lifecycle_updated_at,
          NULL
        FROM vnext_repository_execution_attachments_cdx2b2a`);
        db.exec("DROP TABLE vnext_repository_execution_attachments_cdx2b2a");
      }
      if (decisionUpgradeRequired) {
        db.exec(`INSERT INTO vnext_repository_execution_decision_requests (
          request_fingerprint, decision_request_version, action, workspace_id,
          project_id, expected_state_fingerprint, expected_state_json,
          requested_at, expires_at, status, grant_fingerprint,
          confirmation_source, granted_at, consumed_at, result_fingerprint
        ) SELECT
          request_fingerprint, decision_request_version, action, workspace_id,
          project_id, expected_state_fingerprint, expected_state_json,
          requested_at, expires_at, status, grant_fingerprint,
          confirmation_source, granted_at, consumed_at, result_fingerprint
        FROM vnext_repository_execution_decision_requests_cdx2b2a`);
        db.exec("DROP TABLE vnext_repository_execution_decision_requests_cdx2b2a");
      }
      // Renaming the prior tables carries their index names with them. The
      // drops above release those names; a second schema pass recreates every
      // canonical index against the upgraded tables.
      db.exec(vNextRepositoryExecutionStoreSchemaSqlV01);
      db.exec("COMMIT");
    } catch (error) {
      if (db.inTransaction) db.exec("ROLLBACK");
      throw error;
    }
  }
  db.exec(vNextRepositoryExecutionStoreSchemaSqlV01);
  return {
    created_tables: tableNames.filter((name) => !before.has(`table:${name}`)),
    created_indexes: indexNames.filter((name) => !before.has(`index:${name}`)),
  };
}

export const vNextProjectLifecycleSchemaSqlV01 = `
  CREATE TABLE IF NOT EXISTS vnext_recent_projects (
    workspace_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    recent_project_entry_version TEXT NOT NULL CHECK (recent_project_entry_version = 'recent_project_entry.v0.1'),
    created_at TEXT NOT NULL CHECK (length(trim(created_at)) > 0),
    last_opened_at TEXT NOT NULL CHECK (length(trim(last_opened_at)) > 0),
    PRIMARY KEY (workspace_id, project_id),
    FOREIGN KEY (workspace_id, project_id) REFERENCES vnext_project_identities(workspace_id, project_id) ON UPDATE RESTRICT ON DELETE RESTRICT
  );
  CREATE INDEX IF NOT EXISTS idx_vnext_recent_projects_workspace_opened
    ON vnext_recent_projects(workspace_id, last_opened_at DESC, project_id);
  CREATE TABLE IF NOT EXISTS vnext_active_project_selections (
    workspace_id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    active_project_selection_version TEXT NOT NULL CHECK (active_project_selection_version = 'active_project_selection.v0.1'),
    selection_revision INTEGER NOT NULL CHECK (selection_revision > 0),
    selected_at TEXT NOT NULL CHECK (length(trim(selected_at)) > 0),
    FOREIGN KEY (workspace_id, project_id) REFERENCES vnext_project_identities(workspace_id, project_id) ON UPDATE RESTRICT ON DELETE RESTRICT
  );
`;

export function migrateVNextProjectLifecycleV01(db) {
  const names = ["vnext_recent_projects", "vnext_active_project_selections", "idx_vnext_recent_projects_workspace_opened"];
  const before = new Set(db.prepare(`SELECT type || ':' || name AS key FROM sqlite_master WHERE name IN (?, ?, ?)`)
    .all(...names).map((row) => row.key));
  db.exec(vNextProjectLifecycleSchemaSqlV01);
  return {
    created_tables: names.slice(0, 2).filter((name) => !before.has(`table:${name}`)),
    created_indexes: names.slice(2).filter((name) => !before.has(`index:${name}`)),
  };
}

export const vNextProjectControlSchemaSqlV01 = `
  CREATE TABLE IF NOT EXISTS vnext_project_automation_controls (
    workspace_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    control_version TEXT NOT NULL CHECK (control_version = 'project_automation_control.v0.1'),
    enabled INTEGER NOT NULL CHECK (enabled IN (0, 1)),
    paused INTEGER NOT NULL CHECK (paused IN (0, 1)),
    policy_version TEXT NOT NULL CHECK (policy_version = 'project_automation_policy.v0.1'),
    policy_json TEXT NOT NULL CHECK (json_valid(policy_json) AND json_type(policy_json) = 'object'),
    revision INTEGER NOT NULL CHECK (revision > 0),
    created_at TEXT NOT NULL CHECK (length(trim(created_at)) > 0),
    updated_at TEXT NOT NULL CHECK (length(trim(updated_at)) > 0),
    PRIMARY KEY (workspace_id, project_id),
    FOREIGN KEY (workspace_id, project_id) REFERENCES vnext_project_identities(workspace_id, project_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CHECK (paused = 0 OR enabled = 1)
  );
  CREATE TABLE IF NOT EXISTS vnext_project_personal_perspective_scopes (
    workspace_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    scope_version TEXT NOT NULL CHECK (scope_version = 'personal_perspective_project_scope.v0.1'),
    selection TEXT NOT NULL CHECK (selection IN ('included', 'excluded')),
    revision INTEGER NOT NULL CHECK (revision > 0),
    created_at TEXT NOT NULL CHECK (length(trim(created_at)) > 0),
    updated_at TEXT NOT NULL CHECK (length(trim(updated_at)) > 0),
    PRIMARY KEY (workspace_id, project_id),
    FOREIGN KEY (workspace_id, project_id) REFERENCES vnext_project_identities(workspace_id, project_id) ON UPDATE RESTRICT ON DELETE RESTRICT
  );
`;

export function migrateVNextProjectControlsV01(db) {
  const names = [
    "vnext_project_automation_controls",
    "vnext_project_personal_perspective_scopes",
  ];
  const before = new Set(
    db
      .prepare(
        `SELECT type || ':' || name AS key FROM sqlite_master WHERE name IN (?, ?)`,
      )
      .all(...names)
      .map((row) => row.key),
  );
  db.exec(vNextProjectControlSchemaSqlV01);
  return {
    created_tables: names.filter((name) => !before.has(`table:${name}`)),
    created_indexes: [],
  };
}

export const vNextProjectContinuityPinSchemaSqlV01 = `
  CREATE TABLE IF NOT EXISTS vnext_project_continuity_pin_collections (
    workspace_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    collection_version TEXT NOT NULL CHECK (
      collection_version = 'project_continuity_pin_collection.v0.1'
    ),
    revision INTEGER NOT NULL CHECK (revision > 0),
    created_at TEXT NOT NULL CHECK (length(trim(created_at)) > 0),
    updated_at TEXT NOT NULL CHECK (length(trim(updated_at)) > 0),
    PRIMARY KEY (workspace_id, project_id),
    FOREIGN KEY (workspace_id, project_id)
      REFERENCES vnext_project_identities(workspace_id, project_id)
      ON UPDATE RESTRICT ON DELETE RESTRICT
  );

  CREATE TABLE IF NOT EXISTS vnext_project_continuity_pins (
    workspace_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    target_key TEXT NOT NULL CHECK (
      length(target_key) = 71 AND substr(target_key, 1, 7) = 'sha256:'
    ),
    target_ref_json TEXT NOT NULL CHECK (
      json_valid(target_ref_json) AND json_type(target_ref_json) = 'object'
    ),
    source_family_snapshot TEXT NOT NULL CHECK (
      source_family_snapshot IN (
        'project_lifecycle',
        'delegated_work',
        'current_run',
        'saved_result',
        'project_attention',
        'recent_change',
        'continuation'
      )
    ),
    source_item_id_snapshot TEXT NOT NULL CHECK (
      length(trim(source_item_id_snapshot)) > 0 AND
      length(source_item_id_snapshot) <= 512
    ),
    label_snapshot TEXT NOT NULL CHECK (
      length(trim(label_snapshot)) > 0 AND length(label_snapshot) <= 1024
    ),
    state_snapshot TEXT NOT NULL CHECK (
      length(trim(state_snapshot)) > 0 AND length(state_snapshot) <= 1024
    ),
    sort_order INTEGER NOT NULL CHECK (sort_order >= 0),
    pinned_at TEXT NOT NULL CHECK (length(trim(pinned_at)) > 0),
    updated_at TEXT NOT NULL CHECK (length(trim(updated_at)) > 0),
    PRIMARY KEY (workspace_id, project_id, target_key),
    UNIQUE (workspace_id, project_id, sort_order),
    FOREIGN KEY (workspace_id, project_id)
      REFERENCES vnext_project_continuity_pin_collections(workspace_id, project_id)
      ON UPDATE RESTRICT ON DELETE RESTRICT
  );

  CREATE INDEX IF NOT EXISTS idx_vnext_project_continuity_pins_project_order
    ON vnext_project_continuity_pins(
      workspace_id, project_id, sort_order, target_key
    );
`;

export function migrateVNextProjectContinuityPinsV01(db) {
  const names = [
    "vnext_project_continuity_pin_collections",
    "vnext_project_continuity_pins",
    "idx_vnext_project_continuity_pins_project_order",
  ];
  const before = new Set(
    db
      .prepare(
        `SELECT type || ':' || name AS key FROM sqlite_master
         WHERE name IN (?, ?, ?)`,
      )
      .all(...names)
      .map((row) => row.key),
  );
  db.exec(vNextProjectContinuityPinSchemaSqlV01);
  return {
    created_tables: names
      .slice(0, 2)
      .filter((name) => !before.has(`table:${name}`)),
    created_indexes: names
      .slice(2)
      .filter((name) => !before.has(`index:${name}`)),
  };
}

export const vNextDurableSemanticStoreSchemaSqlV01 = `
  CREATE TABLE IF NOT EXISTS vnext_core_records (
    record_kind TEXT NOT NULL CHECK (record_kind IN (
      'automation_work_item',
      'capability_grant',
      'evidence_record',
      'claim_record',
      'claim_evidence_relation',
      'episode_delta_proposal',
      'review_decision',
      'semantic_commit_gate',
      'semantic_state',
      'state_transition_receipt',
      'task_context_packet',
      'run_receipt',
      'context_use_review'
    )),
    record_id TEXT NOT NULL CHECK (length(trim(record_id)) > 0),
    workspace_id TEXT NOT NULL CHECK (length(trim(workspace_id)) > 0),
    project_id TEXT NOT NULL CHECK (length(trim(project_id)) > 0),
    fingerprint TEXT NOT NULL CHECK (
      length(fingerprint) = 71 AND substr(fingerprint, 1, 7) = 'sha256:'
    ),
    idempotency_key TEXT CHECK (
      idempotency_key IS NULL OR
      (length(idempotency_key) = 71 AND substr(idempotency_key, 1, 7) = 'sha256:')
    ),
    payload_json TEXT NOT NULL CHECK (
      json_valid(payload_json) AND json_type(payload_json) = 'object'
    ),
    created_at TEXT NOT NULL CHECK (length(trim(created_at)) > 0),
    PRIMARY KEY (record_kind, record_id)
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_vnext_core_records_project_idempotency
    ON vnext_core_records(workspace_id, project_id, record_kind, idempotency_key)
    WHERE idempotency_key IS NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_vnext_core_records_project_kind_created
    ON vnext_core_records(workspace_id, project_id, record_kind, created_at, record_id);

  CREATE TRIGGER IF NOT EXISTS trg_vnext_core_records_immutable_update
    BEFORE UPDATE ON vnext_core_records
    BEGIN SELECT RAISE(ABORT, 'vnext_core_records_immutable'); END;
  CREATE TRIGGER IF NOT EXISTS trg_vnext_core_records_immutable_delete
    BEFORE DELETE ON vnext_core_records
    BEGIN SELECT RAISE(ABORT, 'vnext_core_records_immutable'); END;

  CREATE TABLE IF NOT EXISTS vnext_semantic_state_entries (
    workspace_id TEXT NOT NULL CHECK (length(trim(workspace_id)) > 0),
    project_id TEXT NOT NULL CHECK (length(trim(project_id)) > 0),
    presence TEXT NOT NULL CHECK (presence = 'present'),
    target_key TEXT NOT NULL CHECK (
      length(target_key) = 71 AND substr(target_key, 1, 7) = 'sha256:'
    ),
    target_ref_json TEXT NOT NULL CHECK (
      json_valid(target_ref_json) AND json_type(target_ref_json) = 'object'
    ),
    state_ref_json TEXT NOT NULL CHECK (
      json_valid(state_ref_json) AND json_type(state_ref_json) = 'object'
    ),
    current_state_fingerprint TEXT NOT NULL CHECK (
      length(current_state_fingerprint) = 71 AND substr(current_state_fingerprint, 1, 7) = 'sha256:'
    ),
    bounded_state_summary TEXT NOT NULL CHECK (
      length(bounded_state_summary) > 0 AND length(bounded_state_summary) <= 2000
    ),
    source_proposal_id TEXT NOT NULL,
    source_proposal_fingerprint TEXT NOT NULL CHECK (
      length(source_proposal_fingerprint) = 71 AND substr(source_proposal_fingerprint, 1, 7) = 'sha256:'
    ),
    source_candidate_id TEXT NOT NULL,
    source_candidate_fingerprint TEXT NOT NULL CHECK (
      length(source_candidate_fingerprint) = 71 AND substr(source_candidate_fingerprint, 1, 7) = 'sha256:'
    ),
    source_transition_receipt_id TEXT NOT NULL,
    source_transition_receipt_fingerprint TEXT NOT NULL CHECK (
      length(source_transition_receipt_fingerprint) = 71 AND substr(source_transition_receipt_fingerprint, 1, 7) = 'sha256:'
    ),
    revision INTEGER NOT NULL CHECK (revision >= 1),
    updated_at TEXT NOT NULL CHECK (length(trim(updated_at)) > 0),
    PRIMARY KEY (workspace_id, project_id, target_key)
  );

  CREATE INDEX IF NOT EXISTS idx_vnext_semantic_state_entries_project_updated
    ON vnext_semantic_state_entries(workspace_id, project_id, updated_at, target_key);

  CREATE TABLE IF NOT EXISTS vnext_semantic_target_heads (
    workspace_id TEXT NOT NULL CHECK (length(trim(workspace_id)) > 0),
    project_id TEXT NOT NULL CHECK (length(trim(project_id)) > 0),
    target_key TEXT NOT NULL CHECK (
      length(target_key) = 71 AND substr(target_key, 1, 7) = 'sha256:'
    ),
    revision INTEGER NOT NULL CHECK (revision >= 1),
    presence TEXT NOT NULL CHECK (presence IN ('absent', 'present')),
    current_state_fingerprint TEXT,
    source_transition_receipt_id TEXT NOT NULL CHECK (
      length(trim(source_transition_receipt_id)) > 0
    ),
    source_transition_receipt_fingerprint TEXT NOT NULL CHECK (
      length(source_transition_receipt_fingerprint) = 71 AND
      substr(source_transition_receipt_fingerprint, 1, 7) = 'sha256:'
    ),
    updated_at TEXT NOT NULL CHECK (length(trim(updated_at)) > 0),
    CHECK (
      (presence = 'absent' AND current_state_fingerprint IS NULL) OR
      (presence = 'present' AND current_state_fingerprint IS NOT NULL AND
       length(current_state_fingerprint) = 71 AND
       substr(current_state_fingerprint, 1, 7) = 'sha256:')
    ),
    PRIMARY KEY (workspace_id, project_id, target_key)
  );

  CREATE INDEX IF NOT EXISTS idx_vnext_semantic_target_heads_project_updated
    ON vnext_semantic_target_heads(workspace_id, project_id, updated_at, target_key);
`;

const vNextDurableSemanticStoreArtifactsV01 = {
  tables: [
    "vnext_core_records",
    "vnext_semantic_state_entries",
    "vnext_semantic_target_heads",
  ],
  indexes: [
    "idx_vnext_core_records_project_idempotency",
    "idx_vnext_core_records_project_kind_created",
    "idx_vnext_semantic_state_entries_project_updated",
    "idx_vnext_semantic_target_heads_project_updated",
  ],
  triggers: [
    "trg_vnext_core_records_immutable_update",
    "trg_vnext_core_records_immutable_delete",
  ],
};

const vNextCoreRecordKindsV01 = [
  "automation_work_item",
  "capability_grant",
  "evidence_record",
  "claim_record",
  "claim_evidence_relation",
  "episode_delta_proposal",
  "review_decision",
  "semantic_commit_gate",
  "semantic_state",
  "state_transition_receipt",
  "task_context_packet",
  "run_receipt",
  "context_use_review",
];

const vNextCoreRecordsUpgradeTableV02 =
  "vnext_core_records_upgrade_v0_2";
const vNextCoreRecordsUpgradeTableV03 =
  "vnext_core_records_upgrade_v0_3";

function upgradeVNextCoreRecordKindConstraintV01(db) {
  const table = db
    .prepare(
      "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'vnext_core_records'",
    )
    .get();
  if (
    db
      .prepare(
        `SELECT 1 FROM sqlite_master
         WHERE type = 'table' AND name IN (?, ?)`,
      )
      .get(
        vNextCoreRecordsUpgradeTableV02,
        vNextCoreRecordsUpgradeTableV03,
      )
  ) {
    throw new Error("vnext_core_record_kind_upgrade_orphan_table");
  }
  const tableSql = table?.sql;
  if (
    !table ||
    (typeof tableSql === "string" &&
      vNextCoreRecordKindsV01.every((kind) =>
        tableSql.includes(`'${kind}'`),
      ))
  ) {
    return false;
  }
  if (db.inTransaction) {
    throw new Error("vnext_core_record_kind_upgrade_nested_transaction_forbidden");
  }
  const before = db
    .prepare("SELECT COUNT(*) AS count FROM vnext_core_records")
    .get();
  db.exec("BEGIN IMMEDIATE");
  try {
    db.exec(`
      CREATE TABLE ${vNextCoreRecordsUpgradeTableV03} (
        record_kind TEXT NOT NULL CHECK (record_kind IN (
          'automation_work_item',
          'capability_grant',
          'evidence_record',
          'claim_record',
          'claim_evidence_relation',
          'episode_delta_proposal',
          'review_decision',
          'semantic_commit_gate',
          'semantic_state',
          'state_transition_receipt',
          'task_context_packet',
          'run_receipt',
          'context_use_review'
        )),
        record_id TEXT NOT NULL CHECK (length(trim(record_id)) > 0),
        workspace_id TEXT NOT NULL CHECK (length(trim(workspace_id)) > 0),
        project_id TEXT NOT NULL CHECK (length(trim(project_id)) > 0),
        fingerprint TEXT NOT NULL CHECK (
          length(fingerprint) = 71 AND substr(fingerprint, 1, 7) = 'sha256:'
        ),
        idempotency_key TEXT CHECK (
          idempotency_key IS NULL OR
          (length(idempotency_key) = 71 AND substr(idempotency_key, 1, 7) = 'sha256:')
        ),
        payload_json TEXT NOT NULL CHECK (
          json_valid(payload_json) AND json_type(payload_json) = 'object'
        ),
        created_at TEXT NOT NULL CHECK (length(trim(created_at)) > 0),
        PRIMARY KEY (record_kind, record_id)
      );
      INSERT INTO ${vNextCoreRecordsUpgradeTableV03} (
        record_kind, record_id, workspace_id, project_id, fingerprint,
        idempotency_key, payload_json, created_at
      )
      SELECT
        record_kind, record_id, workspace_id, project_id, fingerprint,
        idempotency_key, payload_json, created_at
      FROM vnext_core_records;
    `);
    const copied = db
      .prepare(
        `SELECT COUNT(*) AS count FROM ${vNextCoreRecordsUpgradeTableV03}`,
      )
      .get();
    if (copied.count !== before.count) {
      throw new Error("vnext_core_record_kind_upgrade_copy_count_mismatch");
    }
    db.exec(`
      DROP TRIGGER IF EXISTS trg_vnext_core_records_immutable_update;
      DROP TRIGGER IF EXISTS trg_vnext_core_records_immutable_delete;
      DROP TABLE vnext_core_records;
      ALTER TABLE ${vNextCoreRecordsUpgradeTableV03}
        RENAME TO vnext_core_records;
      CREATE UNIQUE INDEX idx_vnext_core_records_project_idempotency
        ON vnext_core_records(workspace_id, project_id, record_kind, idempotency_key)
        WHERE idempotency_key IS NOT NULL;
      CREATE INDEX idx_vnext_core_records_project_kind_created
        ON vnext_core_records(workspace_id, project_id, record_kind, created_at, record_id);
      CREATE TRIGGER trg_vnext_core_records_immutable_update
        BEFORE UPDATE ON vnext_core_records
        BEGIN SELECT RAISE(ABORT, 'vnext_core_records_immutable'); END;
      CREATE TRIGGER trg_vnext_core_records_immutable_delete
        BEFORE DELETE ON vnext_core_records
        BEGIN SELECT RAISE(ABORT, 'vnext_core_records_immutable'); END;
    `);
    db.exec("COMMIT");
    return true;
  } catch (error) {
    if (db.inTransaction) db.exec("ROLLBACK");
    throw error;
  }
}

export function migrateVNextDurableSemanticStoreV01(db) {
  const before = new Set(
    db
      .prepare(
        `SELECT type || ':' || name AS key
         FROM sqlite_master
         WHERE name IN (${Object.values(vNextDurableSemanticStoreArtifactsV01)
           .flat()
           .map(() => "?")
           .join(", ")})`,
      )
      .all(...Object.values(vNextDurableSemanticStoreArtifactsV01).flat())
      .map((row) => row.key),
  );

  const rebuiltCoreRecords = upgradeVNextCoreRecordKindConstraintV01(db);
  db.exec(vNextDurableSemanticStoreSchemaSqlV01);

  const created = (type, names) =>
    names.filter((name) => !before.has(`${type}:${name}`));
  return {
    created_tables: created("table", vNextDurableSemanticStoreArtifactsV01.tables),
    created_indexes: created("index", vNextDurableSemanticStoreArtifactsV01.indexes),
    created_triggers: created("trigger", vNextDurableSemanticStoreArtifactsV01.triggers),
    rebuilt_tables: rebuiltCoreRecords ? ["vnext_core_records"] : [],
  };
}

export const vNextLocalOperatorSessionSchemaSqlV01 = `
  CREATE TABLE IF NOT EXISTS vnext_local_operator_sessions (
    session_id TEXT PRIMARY KEY CHECK (
      length(trim(session_id)) > 0 AND length(session_id) <= 256
    ),
    workspace_id TEXT NOT NULL CHECK (
      length(trim(workspace_id)) > 0 AND length(workspace_id) <= 256
    ),
    project_id TEXT NOT NULL CHECK (
      length(trim(project_id)) > 0 AND length(project_id) <= 256
    ),
    operator_id TEXT NOT NULL CHECK (
      length(trim(operator_id)) > 0 AND length(operator_id) <= 256
    ),
    bootstrap_token_hash TEXT NOT NULL UNIQUE CHECK (
      length(bootstrap_token_hash) = 71 AND
      substr(bootstrap_token_hash, 1, 7) = 'sha256:'
    ),
    session_token_hash TEXT UNIQUE CHECK (
      session_token_hash IS NULL OR
      (length(session_token_hash) = 71 AND
       substr(session_token_hash, 1, 7) = 'sha256:')
    ),
    issued_at TEXT NOT NULL CHECK (length(trim(issued_at)) > 0),
    expires_at TEXT NOT NULL CHECK (length(trim(expires_at)) > 0),
    bootstrap_consumed_at TEXT,
    revoked_at TEXT,
    action_nonce_hash TEXT UNIQUE CHECK (
      action_nonce_hash IS NULL OR
      (length(action_nonce_hash) = 71 AND
       substr(action_nonce_hash, 1, 7) = 'sha256:')
    ),
    action_nonce_expires_at TEXT,
    updated_at TEXT NOT NULL CHECK (length(trim(updated_at)) > 0),
    decision_session_token_hash TEXT CHECK (
      decision_session_token_hash IS NULL OR
      (length(decision_session_token_hash) = 71 AND
       substr(decision_session_token_hash, 1, 7) = 'sha256:')
    ),
    decision_action_nonce_hash TEXT CHECK (
      decision_action_nonce_hash IS NULL OR
      (length(decision_action_nonce_hash) = 71 AND
       substr(decision_action_nonce_hash, 1, 7) = 'sha256:')
    ),
    decision_action_nonce_expires_at TEXT,
    CHECK (
      (bootstrap_consumed_at IS NULL AND
       session_token_hash IS NULL AND
       action_nonce_hash IS NULL AND
       action_nonce_expires_at IS NULL) OR
      (bootstrap_consumed_at IS NOT NULL AND
       session_token_hash IS NOT NULL AND
       action_nonce_hash IS NOT NULL AND
       action_nonce_expires_at IS NOT NULL)
    )
  );

  CREATE INDEX IF NOT EXISTS idx_vnext_local_operator_sessions_scope_expiry
    ON vnext_local_operator_sessions(
      workspace_id, project_id, operator_id, revoked_at, expires_at, session_id
    );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_vnext_local_operator_sessions_decision_token
    ON vnext_local_operator_sessions(decision_session_token_hash)
    WHERE decision_session_token_hash IS NOT NULL;
  CREATE UNIQUE INDEX IF NOT EXISTS idx_vnext_local_operator_sessions_decision_nonce
    ON vnext_local_operator_sessions(decision_action_nonce_hash)
    WHERE decision_action_nonce_hash IS NOT NULL;
`;

const vNextLocalOperatorSessionArtifactsV01 = {
  tables: ["vnext_local_operator_sessions"],
  indexes: [
    "idx_vnext_local_operator_sessions_scope_expiry",
    "idx_vnext_local_operator_sessions_decision_token",
    "idx_vnext_local_operator_sessions_decision_nonce",
  ],
};

export function migrateVNextLocalOperatorSessionsV01(db) {
  const tableExists = db.prepare(
    "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'vnext_local_operator_sessions'",
  ).get();
  if (tableExists) {
    const columns = new Set(
      db.prepare("PRAGMA table_info(vnext_local_operator_sessions)")
        .all()
        .map((row) => row.name),
    );
    for (const [name, definition] of [
      ["decision_session_token_hash", "TEXT CHECK (decision_session_token_hash IS NULL OR (length(decision_session_token_hash) = 71 AND substr(decision_session_token_hash, 1, 7) = 'sha256:'))"],
      ["decision_action_nonce_hash", "TEXT CHECK (decision_action_nonce_hash IS NULL OR (length(decision_action_nonce_hash) = 71 AND substr(decision_action_nonce_hash, 1, 7) = 'sha256:'))"],
      ["decision_action_nonce_expires_at", "TEXT"],
    ]) {
      if (!columns.has(name)) {
        db.prepare(
          `ALTER TABLE vnext_local_operator_sessions ADD COLUMN ${name} ${definition}`,
        ).run();
      }
    }
  }
  const names = Object.values(vNextLocalOperatorSessionArtifactsV01).flat();
  const before = new Set(
    db
      .prepare(
        `SELECT type || ':' || name AS key
         FROM sqlite_master
         WHERE name IN (${names.map(() => "?").join(", ")})`,
      )
      .all(...names)
      .map((row) => row.key),
  );
  db.exec(vNextLocalOperatorSessionSchemaSqlV01);
  const created = (type, artifactNames) =>
    artifactNames.filter((name) => !before.has(`${type}:${name}`));
  return {
    created_tables: created(
      "table",
      vNextLocalOperatorSessionArtifactsV01.tables,
    ),
    created_indexes: created(
      "index",
      vNextLocalOperatorSessionArtifactsV01.indexes,
    ),
  };
}
