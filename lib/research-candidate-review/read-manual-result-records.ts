import { openDatabase } from "@/lib/db";
import type {
  ResearchCandidateManualExpectedObservedDeltaRecord,
  ResearchCandidateManualResultReadback,
  ResearchCandidateManualResultRecordsByReceipt,
  ResearchCandidateManualResultRollbackRecord,
  ResearchCandidateManualResultWriteAuthorityBoundary,
  ResearchCandidateManualResultWriteReceipt,
  ResearchCandidateManualReuseOutcomeRecord,
} from "@/types/research-candidate-manual-result-authorized-record-write";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";

export interface ResearchCandidateManualResultRecordDbLike {
  exec(sql: string): unknown;
  prepare(sql: string): {
    run(...params: unknown[]): unknown;
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  };
}

type ReceiptRow = Omit<ResearchCandidateManualResultWriteReceipt, "scope"> & {
  scope: ResearchCandidateReviewScope;
};

type ExpectedObservedDeltaRow = Omit<
  ResearchCandidateManualExpectedObservedDeltaRecord,
  "scope" | "source_refs"
> & {
  scope: ResearchCandidateReviewScope;
  source_refs_json: string;
};

type ReuseOutcomeRow = Omit<
  ResearchCandidateManualReuseOutcomeRecord,
  "scope" | "selected_candidate_context_refs" | "warning_reasons" | "writes_ledger"
> & {
  scope: ResearchCandidateReviewScope;
  selected_candidate_context_refs_json: string;
  warning_reasons_json: string;
};

type RollbackRow = ResearchCandidateManualResultRollbackRecord;

const DEFAULT_SCOPE: ResearchCandidateReviewScope = "project:augnes";

export function getResearchCandidateManualResultWriteAuthorityBoundary(): ResearchCandidateManualResultWriteAuthorityBoundary {
  return {
    can_write_manual_expected_observed_delta_record: true,
    can_write_manual_reuse_outcome_record: true,
    can_write_manual_result_write_receipt: true,
    can_write_manual_result_rollback_metadata: true,
    source_of_truth: false,
    can_write_proof_or_evidence: false,
    can_create_evidence: false,
    can_record_proof: false,
    can_create_or_update_work_item: false,
    can_mutate_work_status: false,
    can_write_work_event: false,
    can_commit_or_reject_state: false,
    can_promote_perspective: false,
    can_mutate_perspective_state: false,
    can_write_perspective_memory: false,
    can_update_global_dogfood_metrics: false,
    can_execute_codex: false,
    can_call_github: false,
    can_call_providers_or_openai: false,
    can_fetch_sources: false,
    can_run_retrieval_rag_embeddings_vector_fts_or_crawler: false,
    can_send_external_handoff: false,
    can_allocate_product_ids: false,
    can_execute_product_write: false,
    persists_raw_manual_note_text: false,
    persists_raw_result_report_text: false,
    persists_operator_notes: false,
  };
}

export function ensureResearchCandidateManualResultRecordWriteSchema(
  db: ResearchCandidateManualResultRecordDbLike,
) {
  db.exec(`
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
  `);
}

export function researchCandidateManualResultRecordSchemaExists(
  db: ResearchCandidateManualResultRecordDbLike,
) {
  const row = db
    .prepare(
      `
        SELECT COUNT(*) AS count
        FROM sqlite_master
        WHERE type = 'table'
          AND name IN (
            'research_candidate_manual_result_write_receipts',
            'research_candidate_manual_expected_observed_delta_records',
            'research_candidate_manual_reuse_outcome_records',
            'research_candidate_manual_result_write_rollbacks'
          )
      `,
    )
    .get() as { count?: number } | undefined;
  return row?.count === 4;
}

export function readResearchCandidateManualResultRecords({
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
  db?: ResearchCandidateManualResultRecordDbLike;
} = {}): ResearchCandidateManualResultReadback {
  const openedDb = db ?? openDatabase();
  const ownsDb = !db;

  try {
    if (!researchCandidateManualResultRecordSchemaExists(openedDb)) {
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
          FROM research_candidate_manual_result_write_receipts
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
      readback_kind: "research_candidate_manual_result_records_readback",
      readback_version: "research_candidate_manual_result_records_readback.v0.1",
      scope,
      records_by_receipt: recordsByReceipt,
      latest_receipts: recordsByReceipt.map((item) => item.receipt),
      count: recordsByReceipt.length,
      authority_boundary: getResearchCandidateManualResultWriteAuthorityBoundary(),
      raw_manual_note_text_present: false,
      raw_result_report_text_present: false,
      proof_or_evidence_rows_written: false,
      work_or_perspective_rows_written: false,
    };
  } finally {
    if (ownsDb && "close" in openedDb && typeof openedDb.close === "function") {
      openedDb.close();
    }
  }
}

export function readResearchCandidateManualResultRecordsByReceiptId(
  receiptId: string,
  {
    scope = DEFAULT_SCOPE,
    db,
  }: {
    scope?: ResearchCandidateReviewScope;
    db?: ResearchCandidateManualResultRecordDbLike;
  } = {},
) {
  const readback = readResearchCandidateManualResultRecords({
    scope,
    receiptId,
    limit: 1,
    db,
  });
  return readback.records_by_receipt[0] ?? null;
}

function readRecordsByReceipt(
  db: ResearchCandidateManualResultRecordDbLike,
  receipt: ResearchCandidateManualResultWriteReceipt,
): ResearchCandidateManualResultRecordsByReceipt {
  const expectedObservedDeltaRow = db
    .prepare(
      `
        SELECT *
        FROM research_candidate_manual_expected_observed_delta_records
        WHERE receipt_id = ?
      `,
    )
    .get(receipt.receipt_id) as ExpectedObservedDeltaRow | undefined;
  const reuseOutcomeRow = db
    .prepare(
      `
        SELECT *
        FROM research_candidate_manual_reuse_outcome_records
        WHERE receipt_id = ?
      `,
    )
    .get(receipt.receipt_id) as ReuseOutcomeRow | undefined;
  const rollbackRow = db
    .prepare(
      `
        SELECT *
        FROM research_candidate_manual_result_write_rollbacks
        WHERE receipt_id = ?
      `,
    )
    .get(receipt.receipt_id) as RollbackRow | undefined;

  return {
    receipt,
    expected_observed_delta_record: expectedObservedDeltaRow
      ? parseExpectedObservedDeltaRow(expectedObservedDeltaRow)
      : null,
    reuse_outcome_record: reuseOutcomeRow
      ? parseReuseOutcomeRow(reuseOutcomeRow)
      : null,
    rollback: rollbackRow ?? null,
    superseded: receipt.write_status === "superseded",
    rolled_back: receipt.write_status === "rolled_back",
  };
}

function emptyReadback(
  scope: ResearchCandidateReviewScope,
): ResearchCandidateManualResultReadback {
  return {
    readback_kind: "research_candidate_manual_result_records_readback",
    readback_version: "research_candidate_manual_result_records_readback.v0.1",
    scope,
    records_by_receipt: [],
    latest_receipts: [],
    count: 0,
    authority_boundary: getResearchCandidateManualResultWriteAuthorityBoundary(),
    raw_manual_note_text_present: false,
    raw_result_report_text_present: false,
    proof_or_evidence_rows_written: false,
    work_or_perspective_rows_written: false,
  };
}

function parseReceiptRow(row: ReceiptRow): ResearchCandidateManualResultWriteReceipt {
  return {
    receipt_id: row.receipt_id,
    created_at: row.created_at,
    scope: row.scope,
    source_preview_session_id: row.source_preview_session_id,
    source_handoff_seed_fingerprint: row.source_handoff_seed_fingerprint,
    source_result_intake_ref: row.source_result_intake_ref,
    source_result_intake_fingerprint: row.source_result_intake_fingerprint,
    source_operator_review_ref: row.source_operator_review_ref,
    source_operator_review_fingerprint: row.source_operator_review_fingerprint,
    source_record_contract_ref: row.source_record_contract_ref,
    source_record_contract_fingerprint: row.source_record_contract_fingerprint,
    idempotency_key: row.idempotency_key,
    write_status: row.write_status,
    operator_decision: row.operator_decision,
    authority_profile: row.authority_profile,
    receipt_fingerprint: row.receipt_fingerprint,
    supersedes_receipt_id: row.supersedes_receipt_id,
    rollback_of_receipt_id: row.rollback_of_receipt_id,
    rollback_reason: row.rollback_reason,
  };
}

function parseExpectedObservedDeltaRow(
  row: ExpectedObservedDeltaRow,
): ResearchCandidateManualExpectedObservedDeltaRecord {
  return {
    record_id: row.record_id,
    receipt_id: row.receipt_id,
    created_at: row.created_at,
    scope: row.scope,
    expected_summary: row.expected_summary,
    observed_summary: row.observed_summary,
    mismatch_or_gap_summary: row.mismatch_or_gap_summary,
    source_handoff_seed_fingerprint: row.source_handoff_seed_fingerprint,
    source_result_text_fingerprint: row.source_result_text_fingerprint,
    source_preview_session_id: row.source_preview_session_id,
    source_refs: parseStringArray(row.source_refs_json),
    authority_profile: row.authority_profile,
    record_fingerprint: row.record_fingerprint,
  };
}

function parseReuseOutcomeRow(row: ReuseOutcomeRow): ResearchCandidateManualReuseOutcomeRecord {
  return {
    record_id: row.record_id,
    receipt_id: row.receipt_id,
    created_at: row.created_at,
    scope: row.scope,
    outcome_label: row.outcome_label,
    selected_candidate_context_refs: parseStringArray(
      row.selected_candidate_context_refs_json,
    ),
    source_line: row.source_line,
    warning_reasons: parseStringArray(row.warning_reasons_json),
    source_handoff_seed_fingerprint: row.source_handoff_seed_fingerprint,
    source_result_text_fingerprint: row.source_result_text_fingerprint,
    source_preview_session_id: row.source_preview_session_id,
    authority_profile: row.authority_profile,
    record_fingerprint: row.record_fingerprint,
    writes_ledger: false,
  };
}

function parseStringArray(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}
