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
