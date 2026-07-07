import { openDatabase } from "@/lib/db";
import type {
  ResearchCandidateManualGlobalDogfoodLedgerReadback,
  ResearchCandidateManualGlobalDogfoodLedgerRecord,
  ResearchCandidateManualGlobalDogfoodLedgerRecordsByReceipt,
  ResearchCandidateManualGlobalDogfoodLedgerRollbackRecord,
  ResearchCandidateManualGlobalDogfoodLedgerWriteAuthorityBoundary,
  ResearchCandidateManualGlobalDogfoodLedgerWriteReceipt,
} from "@/types/research-candidate-manual-global-dogfood-ledger-write";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";

export interface ResearchCandidateManualGlobalDogfoodLedgerDbLike {
  exec(sql: string): unknown;
  prepare(sql: string): {
    run(...params: unknown[]): unknown;
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  };
}

type ReceiptRow = Omit<
  ResearchCandidateManualGlobalDogfoodLedgerWriteReceipt,
  "scope"
> & {
  scope: ResearchCandidateReviewScope;
};

type LedgerRecordRow = Omit<
  ResearchCandidateManualGlobalDogfoodLedgerRecord,
  | "scope"
  | "selected_candidate_context_refs"
  | "manual_only_context_refs"
  | "warning_reasons"
  | "compatibility_findings"
> & {
  scope: ResearchCandidateReviewScope;
  selected_candidate_context_refs_json: string;
  manual_only_context_refs_json: string;
  warning_reasons_json: string;
  compatibility_findings_json: string;
};

type RollbackRow = ResearchCandidateManualGlobalDogfoodLedgerRollbackRecord;

const DEFAULT_SCOPE: ResearchCandidateReviewScope = "project:augnes";

export function getResearchCandidateManualGlobalDogfoodLedgerWriteAuthorityBoundary(): ResearchCandidateManualGlobalDogfoodLedgerWriteAuthorityBoundary {
  return {
    can_write_manual_global_dogfood_ledger_receipt: true,
    can_write_manual_global_dogfood_ledger_record: true,
    can_write_manual_global_dogfood_rollback_metadata: true,
    source_of_truth: false,
    can_write_dogfood_metrics: false,
    can_write_expected_observed_delta_global_record: false,
    can_write_reuse_outcome_global_record: false,
    can_write_proof_or_evidence: false,
    can_mutate_work: false,
    can_promote_perspective: false,
    can_write_perspective_state: false,
    can_write_perspective_memory: false,
    can_mutate_manual_result_records: false,
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

export function ensureResearchCandidateManualGlobalDogfoodLedgerSchema(
  db: ResearchCandidateManualGlobalDogfoodLedgerDbLike,
) {
  db.exec(`
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
  `);
}

export function researchCandidateManualGlobalDogfoodLedgerSchemaExists(
  db: ResearchCandidateManualGlobalDogfoodLedgerDbLike,
) {
  const row = db
    .prepare(
      `
        SELECT COUNT(*) AS count
        FROM sqlite_master
        WHERE type = 'table'
          AND name IN (
            'research_candidate_manual_global_dogfood_ledger_receipts',
            'research_candidate_manual_global_dogfood_ledger_records',
            'research_candidate_manual_global_dogfood_ledger_rollbacks'
          )
      `,
    )
    .get() as { count?: number } | undefined;
  return row?.count === 3;
}

export function readResearchCandidateManualGlobalDogfoodLedger({
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
  db?: ResearchCandidateManualGlobalDogfoodLedgerDbLike;
} = {}): ResearchCandidateManualGlobalDogfoodLedgerReadback {
  const openedDb = db ?? openDatabase();
  const ownsDb = !db;

  try {
    if (!researchCandidateManualGlobalDogfoodLedgerSchemaExists(openedDb)) {
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
          FROM research_candidate_manual_global_dogfood_ledger_receipts
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
      readback_kind: "research_candidate_manual_global_dogfood_ledger_readback",
      readback_version:
        "research_candidate_manual_global_dogfood_ledger_readback.v0.1",
      scope,
      records_by_receipt: recordsByReceipt,
      latest_receipts: recordsByReceipt.map((item) => item.receipt),
      latest_active_committed:
        recordsByReceipt.find(
          (item) =>
            item.receipt.ledger_write_status === "committed" &&
            !item.superseded &&
            !item.rolled_back,
        ) ?? null,
      count: recordsByReceipt.length,
      authority_boundary:
        getResearchCandidateManualGlobalDogfoodLedgerWriteAuthorityBoundary(),
      raw_manual_note_text_present: false,
      raw_result_report_text_present: false,
      operator_notes_persisted: false,
      dogfood_metrics_written: false,
      expected_observed_delta_global_record_written: false,
      reuse_outcome_global_record_written: false,
      proof_or_evidence_rows_written: false,
      work_or_perspective_rows_written: false,
      perspective_memory_written: false,
      product_write_executed: false,
    };
  } finally {
    if (ownsDb && "close" in openedDb && typeof openedDb.close === "function") {
      openedDb.close();
    }
  }
}

export function readResearchCandidateManualGlobalDogfoodLedgerByReceiptId(
  receiptId: string,
  {
    scope = DEFAULT_SCOPE,
    db,
  }: {
    scope?: ResearchCandidateReviewScope;
    db?: ResearchCandidateManualGlobalDogfoodLedgerDbLike;
  } = {},
) {
  const readback = readResearchCandidateManualGlobalDogfoodLedger({
    scope,
    receiptId,
    limit: 1,
    db,
  });
  return readback.records_by_receipt[0] ?? null;
}

function readRecordsByReceipt(
  db: ResearchCandidateManualGlobalDogfoodLedgerDbLike,
  receipt: ResearchCandidateManualGlobalDogfoodLedgerWriteReceipt,
): ResearchCandidateManualGlobalDogfoodLedgerRecordsByReceipt {
  const ledgerRecordRow = db
    .prepare(
      `
        SELECT *
        FROM research_candidate_manual_global_dogfood_ledger_records
        WHERE receipt_id = ?
        LIMIT 1
      `,
    )
    .get(receipt.receipt_id) as LedgerRecordRow | undefined;
  const rollbackRow = db
    .prepare(
      `
        SELECT *
        FROM research_candidate_manual_global_dogfood_ledger_rollbacks
        WHERE receipt_id = ?
        LIMIT 1
      `,
    )
    .get(receipt.receipt_id) as RollbackRow | undefined;

  return {
    receipt,
    ledger_record: ledgerRecordRow ? parseLedgerRecordRow(ledgerRecordRow) : null,
    rollback: rollbackRow ? parseRollbackRow(rollbackRow) : null,
    superseded: receipt.ledger_write_status === "superseded",
    rolled_back: receipt.ledger_write_status === "rolled_back",
  };
}

function parseReceiptRow(
  row: ReceiptRow,
): ResearchCandidateManualGlobalDogfoodLedgerWriteReceipt {
  return {
    ...row,
    scope: row.scope,
    supersedes_receipt_id: row.supersedes_receipt_id ?? null,
    rollback_of_receipt_id: row.rollback_of_receipt_id ?? null,
    rollback_reason: row.rollback_reason ?? null,
  };
}

function parseLedgerRecordRow(
  row: LedgerRecordRow,
): ResearchCandidateManualGlobalDogfoodLedgerRecord {
  return {
    ...row,
    scope: row.scope,
    observed_summary: row.observed_summary ?? null,
    source_line: row.source_line ?? null,
    selected_candidate_context_refs: parseStringArray(
      row.selected_candidate_context_refs_json,
    ),
    manual_only_context_refs: parseStringArray(row.manual_only_context_refs_json),
    warning_reasons: parseStringArray(row.warning_reasons_json),
    compatibility_findings: parseJsonArray(row.compatibility_findings_json),
  };
}

function parseRollbackRow(
  row: RollbackRow,
): ResearchCandidateManualGlobalDogfoodLedgerRollbackRecord {
  return row;
}

function emptyReadback(
  scope: ResearchCandidateReviewScope,
): ResearchCandidateManualGlobalDogfoodLedgerReadback {
  return {
    readback_kind: "research_candidate_manual_global_dogfood_ledger_readback",
    readback_version:
      "research_candidate_manual_global_dogfood_ledger_readback.v0.1",
    scope,
    records_by_receipt: [],
    latest_receipts: [],
    latest_active_committed: null,
    count: 0,
    authority_boundary:
      getResearchCandidateManualGlobalDogfoodLedgerWriteAuthorityBoundary(),
    raw_manual_note_text_present: false,
    raw_result_report_text_present: false,
    operator_notes_persisted: false,
    dogfood_metrics_written: false,
    expected_observed_delta_global_record_written: false,
    reuse_outcome_global_record_written: false,
    proof_or_evidence_rows_written: false,
    work_or_perspective_rows_written: false,
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
