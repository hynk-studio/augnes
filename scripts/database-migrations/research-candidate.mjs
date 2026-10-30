// This family owns its migration implementations and canonical result assembly.
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

export function prepareResearchCandidateMigrations(db) {
  const researchCandidateManualNotePreviewDraftsResult =
    migrateResearchCandidateManualNotePreviewDrafts(db);
  const researchCandidateManualNotePreviewDraftDiscardsResult =
    migrateResearchCandidateManualNotePreviewDraftDiscards(db);
  const researchCandidateManualNotePreviewDraftActivitiesResult =
    migrateResearchCandidateManualNotePreviewDraftActivities(db);
  const researchCandidateManualResultRecordsResult =
    migrateResearchCandidateManualResultRecords(db);
  const researchCandidateManualGlobalDogfoodLedgerResult =
    migrateResearchCandidateManualGlobalDogfoodLedger(db);
  const researchCandidateManualGlobalDogfoodMetricSnapshotResult =
    migrateResearchCandidateManualGlobalDogfoodMetricSnapshot(db);
  const researchCandidateManualGlobalDogfoodNextWorkSignalResult =
    migrateResearchCandidateManualGlobalDogfoodNextWorkSignal(db);
  const researchCandidateManualGlobalDogfoodNextWorkBiasResult =
    migrateResearchCandidateManualGlobalDogfoodNextWorkBias(db);
  const researchCandidateManualGlobalDogfoodPerspectiveRelayResult =
    migrateResearchCandidateManualGlobalDogfoodPerspectiveRelay(db);
  const researchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateResult =
    migrateResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdate(db);
  const researchCandidateManualGlobalDogfoodPerspectiveApplyResult =
    migrateResearchCandidateManualGlobalDogfoodPerspectiveApply(db);
  const researchCandidateManualGlobalDogfoodPerspectiveStateMutationResult =
    migrateResearchCandidateManualGlobalDogfoodPerspectiveStateMutation(db);
  const researchCandidateManualGlobalDogfoodPerspectiveAdapterResult =
    migrateResearchCandidateManualGlobalDogfoodPerspectiveAdapter(db);
  const researchCandidateManualGlobalDogfoodPerspectiveStateApplicationResult =
    migrateResearchCandidateManualGlobalDogfoodPerspectiveStateApplication(db);
  const researchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityResult =
    migrateResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibility(db);
  const researchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordResult =
    migrateResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecord(
      db,
    );
  return {
    researchCandidateManualNotePreviewDraftsResult,
    researchCandidateManualNotePreviewDraftDiscardsResult,
    researchCandidateManualNotePreviewDraftActivitiesResult,
    researchCandidateManualResultRecordsResult,
    researchCandidateManualGlobalDogfoodLedgerResult,
    researchCandidateManualGlobalDogfoodMetricSnapshotResult,
    researchCandidateManualGlobalDogfoodNextWorkSignalResult,
    researchCandidateManualGlobalDogfoodNextWorkBiasResult,
    researchCandidateManualGlobalDogfoodPerspectiveRelayResult,
    researchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateResult,
    researchCandidateManualGlobalDogfoodPerspectiveApplyResult,
    researchCandidateManualGlobalDogfoodPerspectiveStateMutationResult,
    researchCandidateManualGlobalDogfoodPerspectiveAdapterResult,
    researchCandidateManualGlobalDogfoodPerspectiveStateApplicationResult,
    researchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityResult,
    researchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordResult,
  };
}
