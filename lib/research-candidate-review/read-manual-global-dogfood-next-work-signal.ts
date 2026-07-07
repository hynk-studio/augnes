import { openDatabase } from "@/lib/db";
import type {
  ResearchCandidateManualGlobalDogfoodNextWorkSignalReadback,
  ResearchCandidateManualGlobalDogfoodNextWorkSignalRecord,
  ResearchCandidateManualGlobalDogfoodNextWorkSignalRecordsByReceipt,
  ResearchCandidateManualGlobalDogfoodNextWorkSignalRollbackRecord,
  ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteAuthorityBoundary,
  ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteReceipt,
} from "@/types/research-candidate-manual-global-dogfood-next-work-signal-write";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";

export interface ResearchCandidateManualGlobalDogfoodNextWorkSignalDbLike {
  exec(sql: string): unknown;
  prepare(sql: string): {
    run(...params: unknown[]): unknown;
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  };
}

type ReceiptRow = Omit<
  ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteReceipt,
  "scope"
> & {
  scope: ResearchCandidateReviewScope;
};

type RecordRow = Omit<
  ResearchCandidateManualGlobalDogfoodNextWorkSignalRecord,
  | "scope"
  | "selected_candidate_context_refs"
  | "source_next_work_candidate_card_ids"
  | "blockers"
  | "warnings"
  | "manual_only_context_refs"
  | "source_refs"
> & {
  scope: ResearchCandidateReviewScope;
  selected_candidate_context_refs_json: string;
  source_next_work_candidate_card_ids_json: string;
  blockers_json: string;
  warnings_json: string;
  manual_only_context_refs_json: string;
  source_refs_json: string;
};

type RollbackRow =
  ResearchCandidateManualGlobalDogfoodNextWorkSignalRollbackRecord;

const DEFAULT_SCOPE: ResearchCandidateReviewScope = "project:augnes";

export function getResearchCandidateManualGlobalDogfoodNextWorkSignalWriteAuthorityBoundary(): ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteAuthorityBoundary {
  return {
    can_write_next_work_signal_decision_record: true,
    can_write_next_work_signal_decision_receipt: true,
    can_write_next_work_signal_rollback_metadata: true,
    source_of_truth: false,
    can_write_next_work_bias: false,
    can_write_work_item: false,
    can_mutate_work: false,
    can_write_perspective_state: false,
    can_promote_perspective: false,
    can_write_perspective_memory: false,
    can_write_dogfood_metrics: false,
    can_write_global_dogfood_ledger: false,
    can_mutate_manual_global_dogfood_ledger: false,
    can_write_metric_snapshot: false,
    can_mutate_metric_snapshot: false,
    can_write_proof_or_evidence: false,
    can_execute_codex: false,
    can_call_github: false,
    can_call_providers_or_openai: false,
    can_fetch_sources: false,
    can_run_retrieval_rag_embeddings_vector_fts_or_crawler: false,
    can_allocate_product_ids: false,
    can_execute_product_write: false,
    persists_raw_manual_note_text: false,
    persists_raw_result_report_text: false,
    persists_operator_notes: false,
  };
}

export function ensureResearchCandidateManualGlobalDogfoodNextWorkSignalSchema(
  db: ResearchCandidateManualGlobalDogfoodNextWorkSignalDbLike,
) {
  db.exec(`
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
  `);
}

export function researchCandidateManualGlobalDogfoodNextWorkSignalSchemaExists(
  db: ResearchCandidateManualGlobalDogfoodNextWorkSignalDbLike,
) {
  const row = db
    .prepare(
      `
        SELECT COUNT(*) AS count
        FROM sqlite_master
        WHERE type = 'table'
          AND name IN (
            'research_candidate_manual_global_dogfood_next_work_signal_receipts',
            'research_candidate_manual_global_dogfood_next_work_signal_records',
            'research_candidate_manual_global_dogfood_next_work_signal_rollbacks'
          )
      `,
    )
    .get() as { count?: number } | undefined;
  return row?.count === 3;
}

export function readResearchCandidateManualGlobalDogfoodNextWorkSignal({
  scope = DEFAULT_SCOPE,
  receiptId,
  idempotencyKey,
  limit = 25,
  db,
}: {
  scope?: ResearchCandidateReviewScope;
  receiptId?: string | null;
  idempotencyKey?: string | null;
  limit?: number;
  db?: ResearchCandidateManualGlobalDogfoodNextWorkSignalDbLike;
} = {}): ResearchCandidateManualGlobalDogfoodNextWorkSignalReadback {
  const openedDb = db ?? openDatabase();
  const ownsDb = !db;

  try {
    if (!researchCandidateManualGlobalDogfoodNextWorkSignalSchemaExists(openedDb)) {
      return emptyReadback(scope);
    }

    const clauses = ["scope = ?"];
    const params: unknown[] = [scope];
    if (receiptId) {
      clauses.push("receipt_id = ?");
      params.push(receiptId);
    }
    if (idempotencyKey) {
      clauses.push("idempotency_key = ?");
      params.push(idempotencyKey);
    }

    const rows = openedDb
      .prepare(
        `
          SELECT *
          FROM research_candidate_manual_global_dogfood_next_work_signal_receipts
          WHERE ${clauses.join(" AND ")}
          ORDER BY created_at DESC, receipt_id DESC
          LIMIT ?
        `,
      )
      .all(...params, Math.max(1, Math.min(limit, 100))) as ReceiptRow[];
    const recordsByReceipt = rows.map((row) =>
      readRecordsByReceipt(openedDb, parseReceiptRow(row)),
    );

    return {
      readback_kind:
        "research_candidate_manual_global_dogfood_next_work_signal_readback",
      readback_version:
        "research_candidate_manual_global_dogfood_next_work_signal_readback.v0.1",
      scope,
      records_by_receipt: recordsByReceipt,
      latest_receipts: recordsByReceipt.map((item) => item.receipt),
      latest_active_committed:
        recordsByReceipt.find(
          (item) =>
            item.receipt.write_status === "committed" &&
            !item.superseded &&
            !item.rolled_back,
        ) ?? null,
      count: recordsByReceipt.length,
      authority_boundary:
        getResearchCandidateManualGlobalDogfoodNextWorkSignalWriteAuthorityBoundary(),
      raw_manual_note_text_present: false,
      raw_result_report_text_present: false,
      operator_notes_persisted: false,
      next_work_bias_written: false,
      work_or_perspective_rows_written: false,
      dogfood_metrics_written: false,
      metric_snapshot_mutated: false,
      global_dogfood_ledger_mutated: false,
      proof_or_evidence_rows_written: false,
      perspective_memory_written: false,
      product_write_executed: false,
    };
  } finally {
    if (ownsDb && "close" in openedDb && typeof openedDb.close === "function") {
      openedDb.close();
    }
  }
}

export function readResearchCandidateManualGlobalDogfoodNextWorkSignalByReceiptId(
  receiptId: string,
  {
    scope = DEFAULT_SCOPE,
    db,
  }: {
    scope?: ResearchCandidateReviewScope;
    db?: ResearchCandidateManualGlobalDogfoodNextWorkSignalDbLike;
  } = {},
) {
  const readback = readResearchCandidateManualGlobalDogfoodNextWorkSignal({
    scope,
    receiptId,
    limit: 1,
    db,
  });
  return readback.records_by_receipt[0] ?? null;
}

function readRecordsByReceipt(
  db: ResearchCandidateManualGlobalDogfoodNextWorkSignalDbLike,
  receipt: ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteReceipt,
): ResearchCandidateManualGlobalDogfoodNextWorkSignalRecordsByReceipt {
  const recordRow = db
    .prepare(
      `
        SELECT *
        FROM research_candidate_manual_global_dogfood_next_work_signal_records
        WHERE receipt_id = ?
        LIMIT 1
      `,
    )
    .get(receipt.receipt_id) as RecordRow | undefined;
  const rollbackRow = db
    .prepare(
      `
        SELECT *
        FROM research_candidate_manual_global_dogfood_next_work_signal_rollbacks
        WHERE receipt_id = ?
        LIMIT 1
      `,
    )
    .get(receipt.receipt_id) as RollbackRow | undefined;

  return {
    receipt,
    next_work_signal_record: recordRow ? parseRecordRow(recordRow) : null,
    rollback: rollbackRow ? parseRollbackRow(rollbackRow) : null,
    superseded: receipt.write_status === "superseded",
    rolled_back: receipt.write_status === "rolled_back",
  };
}

function parseReceiptRow(
  row: ReceiptRow,
): ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteReceipt {
  return {
    ...row,
    scope: row.scope,
    supersedes_receipt_id: row.supersedes_receipt_id ?? null,
    rollback_of_receipt_id: row.rollback_of_receipt_id ?? null,
    rollback_reason: row.rollback_reason ?? null,
  };
}

function parseRecordRow(
  row: RecordRow,
): ResearchCandidateManualGlobalDogfoodNextWorkSignalRecord {
  return {
    ...row,
    scope: row.scope,
    selected_candidate_context_refs: parseStringArray(
      row.selected_candidate_context_refs_json,
    ),
    source_next_work_candidate_card_ids: parseStringArray(
      row.source_next_work_candidate_card_ids_json,
    ),
    blockers: parseStringArray(row.blockers_json),
    warnings: parseStringArray(row.warnings_json),
    manual_only_context_refs: parseStringArray(row.manual_only_context_refs_json),
    source_refs: parseStringArray(row.source_refs_json),
  };
}

function parseRollbackRow(
  row: RollbackRow,
): ResearchCandidateManualGlobalDogfoodNextWorkSignalRollbackRecord {
  return row;
}

function emptyReadback(
  scope: ResearchCandidateReviewScope,
): ResearchCandidateManualGlobalDogfoodNextWorkSignalReadback {
  return {
    readback_kind:
      "research_candidate_manual_global_dogfood_next_work_signal_readback",
    readback_version:
      "research_candidate_manual_global_dogfood_next_work_signal_readback.v0.1",
    scope,
    records_by_receipt: [],
    latest_receipts: [],
    latest_active_committed: null,
    count: 0,
    authority_boundary:
      getResearchCandidateManualGlobalDogfoodNextWorkSignalWriteAuthorityBoundary(),
    raw_manual_note_text_present: false,
    raw_result_report_text_present: false,
    operator_notes_persisted: false,
    next_work_bias_written: false,
    work_or_perspective_rows_written: false,
    dogfood_metrics_written: false,
    metric_snapshot_mutated: false,
    global_dogfood_ledger_mutated: false,
    proof_or_evidence_rows_written: false,
    perspective_memory_written: false,
    product_write_executed: false,
  };
}

function parseStringArray(value: string): string[] {
  const parsed = parseJsonArray(value);
  return parsed.filter((item): item is string => typeof item === "string");
}

function parseJsonArray(value: string): unknown[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
