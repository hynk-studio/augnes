// This family owns its migration implementations and canonical result assembly.
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

export function preparePerspectiveMemoryMigrations(db) {
  const perspectiveMemoryBoundaryResult =
    migratePerspectiveMemoryProductPersistenceBoundaryRecords(db);
  const perspectiveMemoryItemsResult = migratePerspectiveMemoryItems(db);
  return {
    perspectiveMemoryBoundaryResult,
    perspectiveMemoryItemsResult,
  };
}
