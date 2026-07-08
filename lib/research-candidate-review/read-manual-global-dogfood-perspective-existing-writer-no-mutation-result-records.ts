import { openDatabase } from "@/lib/db";
import type {
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecord,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordReadback,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordRowCountWriteSummary,
} from "@/types/research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-result-record";
import {
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_NO_MUTATION_RESULT_RECORD_READBACK_KIND,
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_NO_MUTATION_RESULT_RECORD_READBACK_VERSION,
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_NO_MUTATION_RESULT_RECORD_TABLE,
} from "@/types/research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-result-record";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";
import { fingerprint } from "@/lib/research-candidate-review/shared-source-chain-guards";

export interface ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordDbLike {
  exec(sql: string): unknown;
  prepare(sql: string): {
    run(...params: unknown[]): unknown;
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  };
}

export interface ReadResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordsOptions {
  db?: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordDbLike;
  scope?: ResearchCandidateReviewScope;
  source_entrypoint_review_fingerprint?: string | null;
  limit?: number;
}

type ResultRecordRow = {
  record_id: string;
  created_at: string;
  scope: ResearchCandidateReviewScope;
  source_entrypoint_review_fingerprint: string;
  source_entrypoint_fingerprint: string;
  source_contract_fingerprint: string;
  source_review_fingerprint: string;
  source_dry_run_result_fingerprint: string;
  source_perspective_writer_compatibility_receipt_id: string;
  source_perspective_writer_compatibility_record_id: string;
  source_perspective_writer_compatibility_record_fingerprint: string;
  safe_adapter_target: string;
  idempotency_key: string;
  accepted_entrypoint_summary_json: string;
  source_row_count_summary_json: string;
  source_non_mutation_summary_json: string;
  source_binding_summary_json: string;
  source_explicit_non_write_boundary_json: string;
  result_record_write_boundary_json: string;
  row_count_write_summary_json: string;
  persisted_material_boundary_json: string;
  validation_json: string;
  record_fingerprint: string;
};

const DEFAULT_SCOPE: ResearchCandidateReviewScope = "project:augnes";

export function ensureResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordSchema(
  db: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordDbLike,
) {
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
}

export function readResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecords({
  db: providedDb,
  scope = DEFAULT_SCOPE,
  source_entrypoint_review_fingerprint = null,
  limit = 20,
}: ReadResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordsOptions = {}): ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordReadback {
  const db = providedDb ?? openDatabase();
  const shouldClose = !providedDb && hasClose(db);

  try {
    ensureResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordSchema(
      db,
    );
    const safeLimit = Math.max(1, Math.min(100, Math.floor(limit)));
    const rows = source_entrypoint_review_fingerprint
      ? (db
          .prepare(
            `
              SELECT *
              FROM ${RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_NO_MUTATION_RESULT_RECORD_TABLE}
              WHERE scope = ?
                AND source_entrypoint_review_fingerprint = ?
              ORDER BY created_at DESC, record_id DESC
              LIMIT ?
            `,
          )
          .all(
            scope,
            source_entrypoint_review_fingerprint,
            safeLimit,
          ) as ResultRecordRow[])
      : (db
          .prepare(
            `
              SELECT *
              FROM ${RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_NO_MUTATION_RESULT_RECORD_TABLE}
              WHERE scope = ?
              ORDER BY created_at DESC, record_id DESC
              LIMIT ?
            `,
          )
          .all(scope, safeLimit) as ResultRecordRow[]);

    const records: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecord[] =
      [];
    let invalidRecordCount = 0;

    for (const row of rows) {
      const record = parseResultRecordRow(row);
      if (record && record.record_fingerprint === computeResultRecordFingerprint(record)) {
        records.push(record);
      } else {
        invalidRecordCount += 1;
      }
    }

    const selectedRecord = records[0] ?? null;
    const selectionStatus = selectedRecord
      ? "selected_latest_valid_record"
      : source_entrypoint_review_fingerprint
        ? "source_entrypoint_review_fingerprint_not_found"
        : "no_records";

    return createReadback({
      scope,
      source_entrypoint_review_fingerprint,
      selection_status: selectionStatus,
      selected_record: selectedRecord,
      records,
      invalid_record_count: invalidRecordCount,
    });
  } finally {
    if (shouldClose) {
      db.close();
    }
  }
}

export function createResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordEmptyReadback({
  scope = DEFAULT_SCOPE,
  source_entrypoint_review_fingerprint = null,
}: {
  scope?: ResearchCandidateReviewScope;
  source_entrypoint_review_fingerprint?: string | null;
} = {}): ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordReadback {
  return createReadback({
    scope,
    source_entrypoint_review_fingerprint,
    selection_status: source_entrypoint_review_fingerprint
      ? "source_entrypoint_review_fingerprint_not_found"
      : "no_records",
    selected_record: null,
    records: [],
    invalid_record_count: 0,
  });
}

export function computeResultRecordFingerprint(
  record: Omit<
    ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecord,
    "record_fingerprint"
  > & { record_fingerprint?: string },
) {
  const { record_fingerprint: _recordFingerprint, ...fingerprintSource } =
    record;
  return fingerprint(fingerprintSource);
}

export function parseResultRecordRow(
  row: ResultRecordRow,
): ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecord | null {
  try {
    return {
      record_kind:
        "research_candidate_manual_global_dogfood_perspective_existing_writer_no_mutation_result_record",
      record_version:
        "research_candidate_manual_global_dogfood_perspective_existing_writer_no_mutation_result_record.v0.1",
      record_id: row.record_id,
      created_at: row.created_at,
      scope: row.scope,
      source_entrypoint_review_fingerprint:
        row.source_entrypoint_review_fingerprint,
      source_entrypoint_fingerprint: row.source_entrypoint_fingerprint,
      source_contract_fingerprint: row.source_contract_fingerprint,
      source_review_fingerprint: row.source_review_fingerprint,
      source_dry_run_result_fingerprint:
        row.source_dry_run_result_fingerprint,
      source_perspective_writer_compatibility_receipt_id:
        row.source_perspective_writer_compatibility_receipt_id,
      source_perspective_writer_compatibility_record_id:
        row.source_perspective_writer_compatibility_record_id,
      source_perspective_writer_compatibility_record_fingerprint:
        row.source_perspective_writer_compatibility_record_fingerprint,
      safe_adapter_target: row.safe_adapter_target,
      idempotency_key: row.idempotency_key,
      accepted_entrypoint_summary: parseJson(
        row.accepted_entrypoint_summary_json,
      ),
      source_row_count_summary: parseJson(row.source_row_count_summary_json),
      source_non_mutation_summary: parseJson(
        row.source_non_mutation_summary_json,
      ),
      source_binding_summary: parseJson(row.source_binding_summary_json),
      source_explicit_non_write_boundary: parseJson(
        row.source_explicit_non_write_boundary_json,
      ),
      result_record_write_boundary: parseJson(
        row.result_record_write_boundary_json,
      ),
      row_count_write_summary: parseJson(
        row.row_count_write_summary_json,
      ) as ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordRowCountWriteSummary,
      persisted_material_boundary: parseJson(
        row.persisted_material_boundary_json,
      ),
      validation: parseJson(row.validation_json),
      record_fingerprint: row.record_fingerprint,
    };
  } catch {
    return null;
  }
}

function createReadback({
  scope,
  source_entrypoint_review_fingerprint,
  selection_status,
  selected_record,
  records,
  invalid_record_count,
}: Pick<
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordReadback,
  | "scope"
  | "selection_status"
  | "selected_record"
  | "records"
  | "invalid_record_count"
> & {
  source_entrypoint_review_fingerprint: string | null;
}): ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordReadback {
  return {
    readback_kind:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_NO_MUTATION_RESULT_RECORD_READBACK_KIND,
    readback_version:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_NO_MUTATION_RESULT_RECORD_READBACK_VERSION,
    scope,
    source_entrypoint_review_fingerprint_filter:
      source_entrypoint_review_fingerprint,
    selection_status,
    selected_record,
    records,
    invalid_record_count,
    raw_material_persisted: false,
    existing_writer_called: false,
    current_working_perspective_updated: false,
    existing_canonical_perspective_state_table_mutated: false,
    perspective_memory_written: false,
    work_mutated: false,
    proof_or_evidence_written: false,
    dogfood_metrics_written: false,
    provider_openai_called: false,
    github_called: false,
    codex_executed: false,
    sources_fetched: false,
    retrieval_rag_embeddings_vector_fts_or_crawler_run: false,
  };
}

function parseJson(value: string) {
  return JSON.parse(value);
}

function hasClose(
  db: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordDbLike,
): db is ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordDbLike & {
  close(): void;
} {
  return typeof (db as { close?: unknown }).close === "function";
}
