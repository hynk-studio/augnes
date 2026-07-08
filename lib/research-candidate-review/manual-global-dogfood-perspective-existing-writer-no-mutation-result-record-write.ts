import { openDatabase } from "@/lib/db";
import {
  computeResultRecordFingerprint,
  ensureResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordSchema,
  parseResultRecordRow,
  type ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordDbLike,
} from "@/lib/research-candidate-review/read-manual-global-dogfood-perspective-existing-writer-no-mutation-result-records";
import type {
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecord,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordInput,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordPersistedMaterialBoundary,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordRowCountWriteSummary,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordValidation,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordWriteBoundary,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordWriteResult,
} from "@/types/research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-result-record";
import {
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_NO_MUTATION_RESULT_RECORD_KIND,
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_NO_MUTATION_RESULT_RECORD_TABLE,
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_NO_MUTATION_RESULT_RECORD_VERSION,
} from "@/types/research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-result-record";
import {
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_PROTECTED_ROW_COUNT_TABLES,
} from "@/types/research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-result";
import type { ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReview } from "@/types/research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint-review";
import {
  allValuesFalse,
  buildDeterministicIdempotencyKey,
  containsForbiddenRawMaterial,
  isTargetOnlyRowCountWrite,
  requiredStringFieldsPresent,
  stableJson,
  STABLE_FINGERPRINT_ALGORITHM as FINGERPRINT_ALGORITHM,
  stripFingerprintPrefix,
  summarizeTargetOnlyRowCountWrite,
  validateSourceBindingPairs,
} from "@/lib/research-candidate-review/shared-source-chain-guards";

export interface WriteResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordOptions {
  db?: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordDbLike;
  now?: string;
}

type RowCountSnapshot = Record<string, number>;

type ResultRecordRow = {
  record_id: string;
  created_at: string;
  scope: "project:augnes";
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

const NON_TARGET_ROW_COUNT_TABLES =
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_PROTECTED_ROW_COUNT_TABLES;
const TARGET_AND_NON_TARGET_TABLES = [
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_NO_MUTATION_RESULT_RECORD_TABLE,
  ...NON_TARGET_ROW_COUNT_TABLES,
] as const;

export function writeResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecord(
  input: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordInput,
  options: WriteResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordOptions = {},
): ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordWriteResult {
  const validationRefusalReasons = validateInput(input);
  if (validationRefusalReasons.length > 0) {
    return createRefusedResult(validationRefusalReasons);
  }

  const review = input
    .source_entrypoint_review as ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReview;
  const db = options.db ?? openDatabase();
  const shouldClose = !options.db && hasClose(db);

  try {
    ensureResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordSchema(
      db,
    );
    const idempotencyKey = computeIdempotencyKey(review);
    const existingRow = db
      .prepare(
        `
          SELECT *
          FROM ${RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_NO_MUTATION_RESULT_RECORD_TABLE}
          WHERE idempotency_key = ?
        `,
      )
      .get(idempotencyKey) as ResultRecordRow | undefined;

    if (existingRow) {
      const existingRecord = parseResultRecordRow(existingRow);
      if (
        existingRecord &&
        existingRecord.record_fingerprint ===
          computeResultRecordFingerprint(existingRecord)
      ) {
        return createAcceptedResult({
          result_status: "duplicate_replayed",
          record: existingRecord,
          result_record_written: false,
          duplicate_replayed: true,
        });
      }
      return createRefusedResult([
        "idempotency_conflict_existing_result_record_fingerprint_mismatch",
      ]);
    }

    db.exec("BEGIN IMMEDIATE");
    try {
      const beforeCounts = captureRowCounts(db);
      const expectedWriteSummary = buildRowCountWriteSummary({
        beforeCounts,
        afterCounts: {
          ...beforeCounts,
          [RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_NO_MUTATION_RESULT_RECORD_TABLE]:
            beforeCounts[
              RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_NO_MUTATION_RESULT_RECORD_TABLE
            ] + 1,
        },
      });
      const record = buildResultRecord({
        review,
        idempotencyKey,
        createdAt: options.now ?? new Date().toISOString(),
        rowCountWriteSummary: expectedWriteSummary,
      });

      insertResultRecord(db, record);

      const afterCounts = captureRowCounts(db);
      const actualWriteSummary = buildRowCountWriteSummary({
        beforeCounts,
        afterCounts,
      });
      if (!isTargetOnlyWrite(actualWriteSummary)) {
        db.exec("ROLLBACK");
        return createRefusedResult([
          "target_only_result_record_row_count_proof_failed",
        ]);
      }

      db.exec("COMMIT");
      return createAcceptedResult({
        result_status: "written",
        record,
        result_record_written: true,
        duplicate_replayed: false,
      });
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  } finally {
    if (shouldClose) {
      db.close();
    }
  }
}

function validateInput(
  input: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordInput,
) {
  const review = input.source_entrypoint_review ?? null;
  const refusalReasons: string[] = [];

  if (!review) {
    refusalReasons.push("source_entrypoint_review_missing");
    return refusalReasons;
  }
  if (
    review.review_status !==
    "ready_for_future_no_mutation_result_record_planning"
  ) {
    refusalReasons.push("source_entrypoint_review_not_ready");
  }
  if (
    review.operator_decision !==
    "accept_entrypoint_for_future_result_record_planning"
  ) {
    refusalReasons.push("operator_decision_not_accepted");
  }
  if (review.validation.passed !== true) {
    refusalReasons.push("source_entrypoint_review_validation_not_passed");
  }
  if (!review.validation.review_fingerprint) {
    refusalReasons.push("source_entrypoint_review_fingerprint_missing");
  }
  if (!review.accepted_entrypoint_summary) {
    refusalReasons.push("accepted_entrypoint_summary_missing");
  }
  if (
    review.row_count_summary.all_protected_row_counts_unchanged !== true ||
    review.row_count_summary.changed_protected_table_count !== 0 ||
    review.row_count_summary.rows.some(
      (row) => row.changed || row.delta !== 0 || row.before_count !== row.after_count,
    )
  ) {
    refusalReasons.push("source_entrypoint_row_count_delta_or_gap");
  }
  if (
    !review.row_count_summary.row_count_before_after_snapshot_recorded ||
    review.row_count_summary.protected_table_count !==
      review.row_count_summary.rows.length
  ) {
    refusalReasons.push("source_entrypoint_row_count_snapshot_incomplete");
  }
  if (!allValuesFalse(review.non_mutation_summary)) {
    refusalReasons.push("source_entrypoint_non_mutation_summary_not_false");
  }
  if (!allValuesFalse(review.explicit_non_write_boundary)) {
    refusalReasons.push("source_entrypoint_explicit_non_write_boundary_not_false");
  }
  if (!sourceFingerprintsPresent(review)) {
    refusalReasons.push("source_fingerprints_missing");
  }
  if (!sourceWriterCompatibilityRefsPresent(review)) {
    refusalReasons.push("source_writer_compatibility_refs_missing");
  }
  if (!sourceLineageMatchesAcceptedSummary(review)) {
    refusalReasons.push("source_entrypoint_lineage_mismatch");
  }
  if (containsForbiddenRawMaterial(input.candidate_input)) {
    refusalReasons.push("raw_material_fields_present");
  }

  return [...new Set(refusalReasons)];
}

function buildResultRecord({
  review,
  idempotencyKey,
  createdAt,
  rowCountWriteSummary,
}: {
  review: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReview;
  idempotencyKey: string;
  createdAt: string;
  rowCountWriteSummary: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordRowCountWriteSummary;
}): ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecord {
  const acceptedSummary = review.accepted_entrypoint_summary;
  if (!acceptedSummary) {
    throw new Error("accepted entrypoint summary required");
  }
  const refs = review.source_writer_compatibility_refs;
  const validation: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordValidation =
    {
      passed: true,
      fingerprint_algorithm: FINGERPRINT_ALGORITHM,
      source_entrypoint_review_accepted: true,
      source_entrypoint_review_fingerprint: review.validation.review_fingerprint,
      source_entrypoint_fingerprint: review.source_entrypoint_fingerprint ?? "",
      source_contract_fingerprint: review.source_contract_fingerprint ?? "",
      source_review_fingerprint: review.source_review_fingerprint ?? "",
      source_dry_run_result_fingerprint:
        review.source_dry_run_result_fingerprint ?? "",
      source_writer_compatibility_refs_present: true,
      accepted_entrypoint_summary_present: true,
      row_counts_unchanged: true,
      changed_protected_table_count: 0,
      non_mutation_summary_all_false: true,
      explicit_non_write_boundary_all_false: true,
      target_only_write_proven: true,
      raw_material_absent: true,
    };
  const recordId = `manual-global-dogfood-perspective-existing-writer-no-mutation-result-record:${stripFingerprintPrefix(
    idempotencyKey,
  )}`;
  const recordWithoutFingerprint: Omit<
    ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecord,
    "record_fingerprint"
  > = {
    record_kind:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_NO_MUTATION_RESULT_RECORD_KIND,
    record_version:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_NO_MUTATION_RESULT_RECORD_VERSION,
    record_id: recordId,
    created_at: createdAt,
    scope: review.scope,
    source_entrypoint_review_fingerprint: review.validation.review_fingerprint,
    source_entrypoint_fingerprint: review.source_entrypoint_fingerprint ?? "",
    source_contract_fingerprint: review.source_contract_fingerprint ?? "",
    source_review_fingerprint: review.source_review_fingerprint ?? "",
    source_dry_run_result_fingerprint:
      review.source_dry_run_result_fingerprint ?? "",
    source_perspective_writer_compatibility_receipt_id:
      refs.source_perspective_writer_compatibility_receipt_id ?? "",
    source_perspective_writer_compatibility_record_id:
      refs.source_perspective_writer_compatibility_record_id ?? "",
    source_perspective_writer_compatibility_record_fingerprint:
      refs.source_perspective_writer_compatibility_record_fingerprint ?? "",
    safe_adapter_target: review.safe_adapter_target ?? "",
    idempotency_key: idempotencyKey,
    accepted_entrypoint_summary: acceptedSummary,
    source_row_count_summary: review.row_count_summary,
    source_non_mutation_summary: review.non_mutation_summary,
    source_binding_summary: review.source_binding_summary,
    source_explicit_non_write_boundary: review.explicit_non_write_boundary,
    result_record_write_boundary: createResultRecordWriteBoundary(),
    row_count_write_summary: rowCountWriteSummary,
    persisted_material_boundary: createPersistedMaterialBoundary(),
    validation,
  };

  return {
    ...recordWithoutFingerprint,
    record_fingerprint: computeResultRecordFingerprint(recordWithoutFingerprint),
  };
}

function insertResultRecord(
  db: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordDbLike,
  record: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecord,
) {
  db.prepare(
    `
      INSERT INTO research_candidate_manual_global_dogfood_perspective_existing_writer_no_mutation_result_records (
        record_id,
        created_at,
        scope,
        source_entrypoint_review_fingerprint,
        source_entrypoint_fingerprint,
        source_contract_fingerprint,
        source_review_fingerprint,
        source_dry_run_result_fingerprint,
        source_perspective_writer_compatibility_receipt_id,
        source_perspective_writer_compatibility_record_id,
        source_perspective_writer_compatibility_record_fingerprint,
        safe_adapter_target,
        idempotency_key,
        accepted_entrypoint_summary_json,
        source_row_count_summary_json,
        source_non_mutation_summary_json,
        source_binding_summary_json,
        source_explicit_non_write_boundary_json,
        result_record_write_boundary_json,
        row_count_write_summary_json,
        persisted_material_boundary_json,
        validation_json,
        record_fingerprint
      )
      VALUES (
        @record_id,
        @created_at,
        @scope,
        @source_entrypoint_review_fingerprint,
        @source_entrypoint_fingerprint,
        @source_contract_fingerprint,
        @source_review_fingerprint,
        @source_dry_run_result_fingerprint,
        @source_perspective_writer_compatibility_receipt_id,
        @source_perspective_writer_compatibility_record_id,
        @source_perspective_writer_compatibility_record_fingerprint,
        @safe_adapter_target,
        @idempotency_key,
        @accepted_entrypoint_summary_json,
        @source_row_count_summary_json,
        @source_non_mutation_summary_json,
        @source_binding_summary_json,
        @source_explicit_non_write_boundary_json,
        @result_record_write_boundary_json,
        @row_count_write_summary_json,
        @persisted_material_boundary_json,
        @validation_json,
        @record_fingerprint
      )
    `,
  ).run({
    record_id: record.record_id,
    created_at: record.created_at,
    scope: record.scope,
    source_entrypoint_review_fingerprint:
      record.source_entrypoint_review_fingerprint,
    source_entrypoint_fingerprint: record.source_entrypoint_fingerprint,
    source_contract_fingerprint: record.source_contract_fingerprint,
    source_review_fingerprint: record.source_review_fingerprint,
    source_dry_run_result_fingerprint:
      record.source_dry_run_result_fingerprint,
    source_perspective_writer_compatibility_receipt_id:
      record.source_perspective_writer_compatibility_receipt_id,
    source_perspective_writer_compatibility_record_id:
      record.source_perspective_writer_compatibility_record_id,
    source_perspective_writer_compatibility_record_fingerprint:
      record.source_perspective_writer_compatibility_record_fingerprint,
    safe_adapter_target: record.safe_adapter_target,
    idempotency_key: record.idempotency_key,
    accepted_entrypoint_summary_json: stableJson(
      record.accepted_entrypoint_summary,
    ),
    source_row_count_summary_json: stableJson(record.source_row_count_summary),
    source_non_mutation_summary_json: stableJson(
      record.source_non_mutation_summary,
    ),
    source_binding_summary_json: stableJson(record.source_binding_summary),
    source_explicit_non_write_boundary_json: stableJson(
      record.source_explicit_non_write_boundary,
    ),
    result_record_write_boundary_json: stableJson(
      record.result_record_write_boundary,
    ),
    row_count_write_summary_json: stableJson(record.row_count_write_summary),
    persisted_material_boundary_json: stableJson(
      record.persisted_material_boundary,
    ),
    validation_json: stableJson(record.validation),
    record_fingerprint: record.record_fingerprint,
  });
}

function captureRowCounts(
  db: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordDbLike,
): RowCountSnapshot {
  return Object.fromEntries(
    TARGET_AND_NON_TARGET_TABLES.map((tableName) => [
      tableName,
      countRowsIfTableExists(db, tableName),
    ]),
  );
}

function countRowsIfTableExists(
  db: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordDbLike,
  tableName: string,
) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
    throw new Error(`Unsafe table name: ${tableName}`);
  }
  const table = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(tableName) as { name?: string } | undefined;
  if (!table?.name) {
    return 0;
  }
  const row = db
    .prepare(`SELECT COUNT(*) as count FROM ${tableName}`)
    .get() as { count: number };
  return Number(row.count);
}

function buildRowCountWriteSummary({
  beforeCounts,
  afterCounts,
}: {
  beforeCounts: RowCountSnapshot;
  afterCounts: RowCountSnapshot;
}): ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordRowCountWriteSummary {
  return summarizeTargetOnlyRowCountWrite({
    targetTable:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_NO_MUTATION_RESULT_RECORD_TABLE,
    tableNames: TARGET_AND_NON_TARGET_TABLES,
    beforeCounts,
    afterCounts,
  }) as ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordRowCountWriteSummary;
}

function isTargetOnlyWrite(
  summary: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordRowCountWriteSummary,
) {
  return (
    summary.target_table_name ===
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_NO_MUTATION_RESULT_RECORD_TABLE &&
    isTargetOnlyRowCountWrite(summary)
  );
}

function createResultRecordWriteBoundary(): ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordWriteBoundary {
  return {
    can_write_no_mutation_result_record: true,
    target_table_name:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_NO_MUTATION_RESULT_RECORD_TABLE,
    source_of_truth: false,
    can_call_existing_current_working_writer: false,
    can_call_existing_canonical_state_writer: false,
    can_update_current_working_perspective: false,
    can_mutate_existing_canonical_perspective_state: false,
    can_write_existing_canonical_perspective_state: false,
    can_promote_perspective: false,
    can_write_perspective_memory: false,
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
  };
}

function createPersistedMaterialBoundary(): ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordPersistedMaterialBoundary {
  return {
    persists_source_fingerprints: true,
    persists_row_count_proof: true,
    persists_non_mutation_proof: true,
    persists_raw_manual_note: false,
    persists_raw_result_report: false,
    persists_raw_operator_note: false,
    persists_raw_payload: false,
    persists_provider_payload: false,
    persists_secret_or_token: false,
    persists_url_or_env_value: false,
  };
}

function createAcceptedResult({
  result_status,
  record,
  result_record_written,
  duplicate_replayed,
}: {
  result_status: "written" | "duplicate_replayed";
  record: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecord;
  result_record_written: boolean;
  duplicate_replayed: boolean;
}): ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordWriteResult {
  return {
    ok: true,
    result_status,
    refusal_reasons: [],
    record,
    duplicate_replayed,
    result_record_written,
    row_count_write_summary: record.row_count_write_summary,
    existing_writer_called: false,
    existing_current_working_writer_called: false,
    existing_canonical_state_writer_called: false,
    current_working_perspective_updated: false,
    existing_canonical_perspective_state_table_mutated: false,
    perspective_promoted: false,
    perspective_memory_written: false,
    work_mutated: false,
    proof_or_evidence_written: false,
    dogfood_metrics_written: false,
    provider_openai_called: false,
    github_called: false,
    codex_executed: false,
    sources_fetched: false,
    retrieval_rag_embeddings_vector_fts_or_crawler_run: false,
    raw_material_persisted: false,
  };
}

function createRefusedResult(
  refusalReasons: string[],
): ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordWriteResult {
  return {
    ok: false,
    result_status: "refused",
    refusal_reasons: [...new Set(refusalReasons)],
    record: null,
    duplicate_replayed: false,
    result_record_written: false,
    row_count_write_summary: null,
    existing_writer_called: false,
    existing_current_working_writer_called: false,
    existing_canonical_state_writer_called: false,
    current_working_perspective_updated: false,
    existing_canonical_perspective_state_table_mutated: false,
    perspective_promoted: false,
    perspective_memory_written: false,
    work_mutated: false,
    proof_or_evidence_written: false,
    dogfood_metrics_written: false,
    provider_openai_called: false,
    github_called: false,
    codex_executed: false,
    sources_fetched: false,
    retrieval_rag_embeddings_vector_fts_or_crawler_run: false,
    raw_material_persisted: false,
  };
}

function computeIdempotencyKey(
  review: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReview,
) {
  return buildDeterministicIdempotencyKey({
    kind:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_NO_MUTATION_RESULT_RECORD_KIND,
    version:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_NO_MUTATION_RESULT_RECORD_VERSION,
    source: {
      source_entrypoint_review_fingerprint: review.validation.review_fingerprint,
      source_entrypoint_fingerprint: review.source_entrypoint_fingerprint,
      source_contract_fingerprint: review.source_contract_fingerprint,
      source_review_fingerprint: review.source_review_fingerprint,
      source_dry_run_result_fingerprint: review.source_dry_run_result_fingerprint,
      source_writer_compatibility_refs: review.source_writer_compatibility_refs,
    },
  });
}

function sourceFingerprintsPresent(
  review: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReview,
) {
  return requiredStringFieldsPresent(
    {
      source_entrypoint_review_fingerprint:
        review.validation.review_fingerprint,
      source_entrypoint_fingerprint: review.source_entrypoint_fingerprint,
      source_contract_fingerprint: review.source_contract_fingerprint,
      source_review_fingerprint: review.source_review_fingerprint,
      source_dry_run_result_fingerprint:
        review.source_dry_run_result_fingerprint,
    },
    [
      "source_entrypoint_review_fingerprint",
      "source_entrypoint_fingerprint",
      "source_contract_fingerprint",
      "source_review_fingerprint",
      "source_dry_run_result_fingerprint",
    ],
  ).passed;
}

function sourceWriterCompatibilityRefsPresent(
  review: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReview,
) {
  const refs = review.source_writer_compatibility_refs;
  return requiredStringFieldsPresent(
    {
      source_perspective_writer_compatibility_receipt_id:
        refs.source_perspective_writer_compatibility_receipt_id,
      source_perspective_writer_compatibility_record_id:
        refs.source_perspective_writer_compatibility_record_id,
      source_perspective_writer_compatibility_record_fingerprint:
        refs.source_perspective_writer_compatibility_record_fingerprint,
    },
    [
      "source_perspective_writer_compatibility_receipt_id",
      "source_perspective_writer_compatibility_record_id",
      "source_perspective_writer_compatibility_record_fingerprint",
    ],
  ).passed;
}

function sourceLineageMatchesAcceptedSummary(
  review: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReview,
) {
  const summary = review.accepted_entrypoint_summary;
  if (!summary) return false;
  if (summary.source_binding_summary.accepted_mapping_summary_present !== true) {
    return false;
  }
  return validateSourceBindingPairs([
    {
      field: "source_entrypoint_fingerprint",
      expected: review.source_entrypoint_fingerprint,
      actual: summary.source_entrypoint_fingerprint,
      reason: "source_entrypoint_fingerprint_mismatch",
    },
    {
      field: "source_contract_fingerprint",
      expected: review.source_contract_fingerprint,
      actual: summary.source_contract_fingerprint,
      reason: "source_contract_fingerprint_mismatch",
    },
    {
      field: "source_review_fingerprint",
      expected: review.source_review_fingerprint,
      actual: summary.source_review_fingerprint,
      reason: "source_review_fingerprint_mismatch",
    },
    {
      field: "source_dry_run_result_fingerprint",
      expected: review.source_dry_run_result_fingerprint,
      actual: summary.source_dry_run_result_fingerprint,
      reason: "source_dry_run_result_fingerprint_mismatch",
    },
    {
      field: "safe_adapter_target",
      expected: review.safe_adapter_target,
      actual: summary.safe_adapter_target,
      reason: "safe_adapter_target_mismatch",
    },
    {
      field: "source_perspective_writer_compatibility_receipt_id",
      expected:
        review.source_writer_compatibility_refs
          .source_perspective_writer_compatibility_receipt_id,
      actual:
        summary.source_writer_compatibility_refs
          .source_perspective_writer_compatibility_receipt_id,
      reason: "source_perspective_writer_compatibility_receipt_id_mismatch",
    },
    {
      field: "source_perspective_writer_compatibility_record_id",
      expected:
        review.source_writer_compatibility_refs
          .source_perspective_writer_compatibility_record_id,
      actual:
        summary.source_writer_compatibility_refs
          .source_perspective_writer_compatibility_record_id,
      reason: "source_perspective_writer_compatibility_record_id_mismatch",
    },
    {
      field: "source_perspective_writer_compatibility_record_fingerprint",
      expected:
        review.source_writer_compatibility_refs
          .source_perspective_writer_compatibility_record_fingerprint,
      actual:
        summary.source_writer_compatibility_refs
          .source_perspective_writer_compatibility_record_fingerprint,
      reason:
        "source_perspective_writer_compatibility_record_fingerprint_mismatch",
    },
  ]).passed;
}

function hasClose(
  db: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordDbLike,
): db is ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordDbLike & {
  close(): void;
} {
  return typeof (db as { close?: unknown }).close === "function";
}
