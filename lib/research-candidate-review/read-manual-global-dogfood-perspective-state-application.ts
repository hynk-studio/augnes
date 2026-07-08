import { openDatabase } from "@/lib/db";
import type {
  ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationReadback,
  ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationRecord,
  ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationRecordsByReceipt,
  ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationRollbackRecord,
  ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationWriteAuthorityBoundary,
  ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationWriteReceipt,
} from "@/types/research-candidate-manual-global-dogfood-perspective-state-application-write";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";

export interface ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationDbLike {
  exec(sql: string): unknown;
  prepare(sql: string): {
    run(...params: unknown[]): unknown;
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  };
}

type ReceiptRow = Omit<
  ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationWriteReceipt,
  "scope"
> & {
  scope: ResearchCandidateReviewScope;
};

type RecordRow = Omit<
  ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationRecord,
  | "scope"
  | "selected_candidate_context_refs"
  | "source_next_work_candidate_card_ids"
  | "manual_only_context_refs"
  | "blockers"
  | "warnings"
  | "compatibility_findings"
  | "existing_current_working_application_compatibility"
  | "existing_canonical_state_application_compatibility"
  | "manual_state_application_write_path"
  | "source_refs"
> & {
  scope: ResearchCandidateReviewScope;
  selected_candidate_context_refs_json: string;
  source_next_work_candidate_card_ids_json: string;
  manual_only_context_refs_json: string;
  blockers_json: string;
  warnings_json: string;
  compatibility_findings_json: string;
  existing_current_working_application_compatibility_json: string;
  existing_canonical_state_application_compatibility_json: string;
  manual_state_application_write_path_json: string;
  source_refs_json: string;
};

type RollbackRow =
  ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationRollbackRecord;

const DEFAULT_SCOPE: ResearchCandidateReviewScope = "project:augnes";

export function getResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationWriteAuthorityBoundary(): ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationWriteAuthorityBoundary {
  return {
    can_write_perspective_state_application_record: true,
    can_write_perspective_state_application_receipt: true,
    can_write_perspective_state_application_rollback_metadata: true,
    source_of_truth: false,
    can_update_current_working_perspective: false,
    can_mutate_existing_canonical_perspective_state: false,
    can_write_existing_canonical_perspective_state: false,
    can_write_canonical_perspective_state: false,
    can_promote_perspective: false,
    can_write_perspective_memory: false,
    can_mutate_perspective_adapter_record: false,
    can_mutate_perspective_state_mutation_record: false,
    can_mutate_perspective_apply_record: false,
    can_mutate_canonical_perspective_update_record: false,
    can_write_perspective_relay: false,
    can_mutate_perspective_relay: false,
    can_write_next_work_bias: false,
    can_mutate_next_work_bias: false,
    can_write_work_item: false,
    can_mutate_work: false,
    can_write_dogfood_metrics: false,
    can_write_global_dogfood_ledger: false,
    can_write_metric_snapshot: false,
    can_write_next_work_signal_decision: false,
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

export function ensureResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationSchema(
  db: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationDbLike,
) {
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
}

export function researchCandidateManualGlobalDogfoodPerspectiveStateApplicationSchemaExists(
  db: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationDbLike,
) {
  const row = db
    .prepare(
      `
        SELECT COUNT(*) AS count
        FROM sqlite_master
        WHERE type = 'table'
          AND name IN (
            'research_candidate_manual_global_dogfood_perspective_state_application_receipts',
            'research_candidate_manual_global_dogfood_perspective_state_application_records',
            'research_candidate_manual_global_dogfood_perspective_state_application_rollbacks'
          )
      `,
    )
    .get() as { count?: number } | undefined;
  return row?.count === 3;
}

export function readResearchCandidateManualGlobalDogfoodPerspectiveStateApplication({
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
  db?: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationDbLike;
} = {}): ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationReadback {
  const openedDb = db ?? openDatabase();
  const ownsDb = !db;

  try {
    if (!researchCandidateManualGlobalDogfoodPerspectiveStateApplicationSchemaExists(openedDb)) {
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
          FROM research_candidate_manual_global_dogfood_perspective_state_application_receipts
          WHERE ${clauses.join(" AND ")}
          ORDER BY created_at DESC, receipt_id DESC
          LIMIT ?
        `,
      )
      .all(...params, Math.max(1, Math.min(limit, 100))) as ReceiptRow[];
    const recordsByReceipt = rows.map((row) =>
      buildRecordsByReceipt({ db: openedDb, receipt: row }),
    );
    const latestActiveCommitted =
      recordsByReceipt.find(
        (recordSet) =>
          recordSet.receipt.write_status === "committed" &&
          !recordSet.rolled_back &&
          !recordSet.superseded &&
          Boolean(recordSet.perspective_state_application_record),
      ) ?? null;

    return {
      readback_kind:
        "research_candidate_manual_global_dogfood_perspective_state_application_readback",
      readback_version:
        "research_candidate_manual_global_dogfood_perspective_state_application_readback.v0.1",
      scope,
      storage_path: "manual_specific_perspective_state_application_tables",
      records_by_receipt: recordsByReceipt,
      latest_receipts: recordsByReceipt.map((recordSet) => recordSet.receipt),
      latest_active_committed: latestActiveCommitted,
      count: recordsByReceipt.length,
      authority_boundary:
        getResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationWriteAuthorityBoundary(),
      ...readbackFlags(recordsByReceipt.length > 0),
    };
  } finally {
    if (ownsDb && "close" in openedDb && typeof openedDb.close === "function") {
      openedDb.close();
    }
  }
}

export function readResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationByReceiptId(
  receiptId: string,
  {
    scope = DEFAULT_SCOPE,
    db,
  }: {
    scope?: ResearchCandidateReviewScope;
    db?: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationDbLike;
  } = {},
): ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationRecordsByReceipt | null {
  return (
    readResearchCandidateManualGlobalDogfoodPerspectiveStateApplication({
      scope,
      receiptId,
      limit: 1,
      db,
    }).records_by_receipt[0] ?? null
  );
}

function buildRecordsByReceipt({
  db,
  receipt,
}: {
  db: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationDbLike;
  receipt: ReceiptRow;
}): ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationRecordsByReceipt {
  const recordRow = db
    .prepare(
      `
        SELECT *
        FROM research_candidate_manual_global_dogfood_perspective_state_application_records
        WHERE receipt_id = ?
        LIMIT 1
      `,
    )
    .get(receipt.receipt_id) as RecordRow | undefined;
  const rollback = db
    .prepare(
      `
        SELECT *
        FROM research_candidate_manual_global_dogfood_perspective_state_application_rollbacks
        WHERE receipt_id = ?
        LIMIT 1
      `,
    )
    .get(receipt.receipt_id) as RollbackRow | undefined;

  return {
    receipt,
    perspective_state_application_record: recordRow ? normalizeRecord(recordRow) : null,
    rollback: rollback ?? null,
    superseded: receipt.write_status === "superseded",
    rolled_back: receipt.write_status === "rolled_back",
  };
}

function normalizeRecord(
  row: RecordRow,
): ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationRecord {
  return {
    ...row,
    selected_candidate_context_refs: parseJsonArray(
      row.selected_candidate_context_refs_json,
    ),
    source_next_work_candidate_card_ids: parseJsonArray(
      row.source_next_work_candidate_card_ids_json,
    ),
    manual_only_context_refs: parseJsonArray(row.manual_only_context_refs_json),
    blockers: parseJsonArray(row.blockers_json),
    warnings: parseJsonArray(row.warnings_json),
    compatibility_findings: parseJsonArray(row.compatibility_findings_json),
    existing_current_working_application_compatibility: parseJsonObject(
      row.existing_current_working_application_compatibility_json,
    ),
    existing_canonical_state_application_compatibility: parseJsonObject(
      row.existing_canonical_state_application_compatibility_json,
    ),
    manual_state_application_write_path: parseJsonObject(
      row.manual_state_application_write_path_json,
    ),
    source_refs: parseJsonArray(row.source_refs_json),
  };
}

function parseJsonArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function parseJsonObject(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function emptyReadback(
  scope: ResearchCandidateReviewScope,
): ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationReadback {
  return {
    readback_kind:
      "research_candidate_manual_global_dogfood_perspective_state_application_readback",
    readback_version:
      "research_candidate_manual_global_dogfood_perspective_state_application_readback.v0.1",
    scope,
    storage_path: "manual_specific_perspective_state_application_tables",
    records_by_receipt: [],
    latest_receipts: [],
    latest_active_committed: null,
    count: 0,
    authority_boundary:
      getResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationWriteAuthorityBoundary(),
    ...readbackFlags(false),
  };
}

function readbackFlags(hasPerspectiveStateApplicationRows: boolean) {
  return {
    raw_manual_note_text_present: false,
    raw_result_report_text_present: false,
    operator_notes_persisted: false,
    perspective_state_application_record_written: hasPerspectiveStateApplicationRows,
    current_working_perspective_updated: false,
    existing_canonical_perspective_state_table_mutated: false,
    canonical_perspective_state_written: false,
    perspective_promoted: false,
    perspective_memory_written: false,
    perspective_adapter_record_mutated: false,
    perspective_state_mutation_record_mutated: false,
    perspective_apply_record_mutated: false,
    canonical_perspective_update_record_mutated: false,
    perspective_relay_mutated: false,
    next_work_bias_mutated: false,
    work_mutated: false,
    dogfood_metrics_written: false,
    global_dogfood_ledger_mutated: false,
    metric_snapshot_mutated: false,
    next_work_signal_decision_mutated: false,
    proof_or_evidence_rows_written: false,
    product_write_executed: false,
  } as const;
}
