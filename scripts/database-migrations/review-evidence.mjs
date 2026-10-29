// This family owns its migration implementations and canonical result assembly.
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

export function prepareReviewEvidenceMigrations(db) {
  const verificationEvidenceResult = migrateVerificationEvidenceRecords(db);
  const temporalReviewArtifactResult = migrateTemporalPreviewReviewArtifacts(db);
  const temporalReviewArtifactIdempotencyResult =
    migrateTemporalPreviewReviewArtifactIdempotency(db);
  return {
    verificationEvidenceResult,
    temporalReviewArtifactResult,
    temporalReviewArtifactIdempotencyResult,
  };
}
