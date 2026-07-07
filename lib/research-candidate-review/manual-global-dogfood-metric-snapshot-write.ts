import { openDatabase } from "@/lib/db";
import {
  ensureResearchCandidateManualGlobalDogfoodLedgerSchema,
  readResearchCandidateManualGlobalDogfoodLedgerByReceiptId,
  type ResearchCandidateManualGlobalDogfoodLedgerDbLike,
} from "@/lib/research-candidate-review/read-manual-global-dogfood-ledger";
import {
  ensureResearchCandidateManualGlobalDogfoodMetricSnapshotSchema,
  getResearchCandidateManualGlobalDogfoodMetricSnapshotWriteAuthorityBoundary,
  readResearchCandidateManualGlobalDogfoodMetricSnapshot,
  readResearchCandidateManualGlobalDogfoodMetricSnapshotByReceiptId,
  type ResearchCandidateManualGlobalDogfoodMetricSnapshotDbLike,
} from "@/lib/research-candidate-review/read-manual-global-dogfood-metric-snapshot";
import type {
  ResearchCandidateManualGlobalDogfoodMetricSnapshotContract,
} from "@/types/research-candidate-manual-global-dogfood-metric-snapshot-contract";
import type {
  ResearchCandidateManualGlobalDogfoodMetricSnapshotReview,
} from "@/types/research-candidate-manual-global-dogfood-metric-snapshot-review";
import {
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_METRIC_SNAPSHOT_ROLLBACK_CONFIRMATION,
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_METRIC_SNAPSHOT_WRITE_CONFIRMATION,
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_METRIC_SNAPSHOT_WRITE_VERSION,
  type ResearchCandidateManualGlobalDogfoodMetricSnapshotRecord,
  type ResearchCandidateManualGlobalDogfoodMetricSnapshotRollbackRecord,
  type ResearchCandidateManualGlobalDogfoodMetricSnapshotRollbackRequest,
  type ResearchCandidateManualGlobalDogfoodMetricSnapshotRollbackResult,
  type ResearchCandidateManualGlobalDogfoodMetricSnapshotWriteReceipt,
  type ResearchCandidateManualGlobalDogfoodMetricSnapshotWriteRequest,
  type ResearchCandidateManualGlobalDogfoodMetricSnapshotWriteResult,
  type ResearchCandidateManualGlobalDogfoodMetricSnapshotWriteValidation,
} from "@/types/research-candidate-manual-global-dogfood-metric-snapshot-write";

type JsonRecord = Record<string, unknown>;
type MetricSnapshotDbLike =
  ResearchCandidateManualGlobalDogfoodMetricSnapshotDbLike &
    ResearchCandidateManualGlobalDogfoodLedgerDbLike;

const AUTHORITY_PROFILE =
  "manual_research_candidate_global_dogfood_metric_snapshot_write.v0.1" as const;
const FINGERPRINT_ALGORITHM = "fnv1a32_canonical_json_v0_1" as const;
const SUPPORTED_OUTCOME_LABELS = new Set([
  "helpful",
  "stale",
  "missing",
  "noisy",
  "misleading",
]);
const SUPPORTED_OUTCOME_SIGNALS = new Set(["positive", "negative", "ambiguous"]);
const RAW_TEXT_KEYS = new Set([
  "manual_note_text",
  "raw_manual_note_text",
  "codex_result_report_text",
  "raw_result_report_text",
  "raw_result_text",
  "result_report_text",
  "operator_note",
  "operator_notes",
  "raw_operator_notes",
]);
const FORBIDDEN_SIDE_EFFECT_KEYS = [
  /global.*dogfood.*metrics/i,
  /dogfood.*metrics.*global/i,
  /next.*work.*bias/i,
  /perspective/i,
  /memory/i,
  /proof|evidence/i,
  /\bwork\b/i,
  /product|delivery/i,
  /provider|openai/i,
  /github/i,
  /codex/i,
  /retrieval|rag|embedding|vector|fts|crawler|source.*fetch/i,
] as const;

export function writeResearchCandidateManualGlobalDogfoodMetricSnapshot(
  request: unknown,
  options: { db?: MetricSnapshotDbLike } = {},
): ResearchCandidateManualGlobalDogfoodMetricSnapshotWriteResult {
  const validation =
    validateResearchCandidateManualGlobalDogfoodMetricSnapshotWriteRequest(
      request,
    );
  const boundary =
    getResearchCandidateManualGlobalDogfoodMetricSnapshotWriteAuthorityBoundary();
  if (!validation.passed || !isRecord(request)) {
    return refusedResult({
      validation,
      idempotencyKey: validation.idempotency_key,
    });
  }

  const typedRequest =
    request as unknown as ResearchCandidateManualGlobalDogfoodMetricSnapshotWriteRequest;
  const contract = typedRequest.metric_snapshot_contract;
  const db = options.db ?? (openDatabase() as unknown as MetricSnapshotDbLike);
  const ownsDb = !options.db;

  try {
    ensureResearchCandidateManualGlobalDogfoodLedgerSchema(db);
    ensureResearchCandidateManualGlobalDogfoodMetricSnapshotSchema(db);
    const sourceLedger = readResearchCandidateManualGlobalDogfoodLedgerByReceiptId(
      contract.source_latest_active_committed_receipt_id!,
      {
        scope: contract.scope,
        db,
      },
    );
    const sourceFailures = validateSourceManualGlobalDogfoodLedger({
      sourceLedger,
      contract,
    });
    if (sourceFailures.length > 0) {
      return refusedResult({
        validation: validationWithFailures(validation, sourceFailures),
        idempotencyKey: validation.idempotency_key,
      });
    }

    const createdAt = new Date().toISOString();
    const receipt = buildReceipt({
      request: typedRequest,
      idempotencyKey: validation.idempotency_key!,
      createdAt,
    });
    const metricSnapshotRecord = buildMetricSnapshotRecord({
      request: typedRequest,
      receipt,
      createdAt,
    });

    let transactionStarted = false;
    try {
      db.prepare("BEGIN IMMEDIATE").run();
      transactionStarted = true;

      const existingReadback =
        readResearchCandidateManualGlobalDogfoodMetricSnapshot({
          scope: contract.scope,
          idempotencyKey: validation.idempotency_key,
          limit: 1,
          db,
        });
      const existing = existingReadback.records_by_receipt[0];
      if (typedRequest.operator_authorization.write_mode === "supersede_previous") {
        const supersedeTargetFailure = validateSupersedeTargetForRequest({
          db,
          request: typedRequest,
          existingReceipt: existing?.receipt ?? null,
        });
        if (supersedeTargetFailure) {
          rollbackWriteTransaction(db);
          transactionStarted = false;
          return refusedResult({
            validation: validationWithFailures(validation, [
              supersedeTargetFailure,
            ]),
            idempotencyKey: validation.idempotency_key,
          });
        }
      }
      if (existing) {
        rollbackWriteTransaction(db);
        transactionStarted = false;
        return duplicateReplayResult({
          validation,
          readback: existingReadback,
        });
      }

      if (typedRequest.operator_authorization.write_mode === "supersede_previous") {
        const supersedeFailure = supersedePreviousReceipt({
          db,
          request: typedRequest,
        });
        if (supersedeFailure) {
          rollbackWriteTransaction(db);
          transactionStarted = false;
          return refusedResult({
            validation: validationWithFailures(validation, [supersedeFailure]),
            idempotencyKey: validation.idempotency_key,
          });
        }
      }

      insertReceipt(db, receipt);
      insertMetricSnapshotRecord(db, metricSnapshotRecord);
      db.prepare("COMMIT").run();
      transactionStarted = false;
    } catch {
      if (transactionStarted) {
        rollbackWriteTransaction(db);
      }
      const duplicateReadback =
        readResearchCandidateManualGlobalDogfoodMetricSnapshot({
          scope: contract.scope,
          idempotencyKey: validation.idempotency_key,
          limit: 1,
          db,
        });
      if (duplicateReadback.records_by_receipt[0]) {
        return duplicateReplayResult({
          validation,
          readback: duplicateReadback,
        });
      }
      return refusedResult({
        validation: validationWithFailures(validation, [
          "sqlite_transaction_failed",
        ]),
        idempotencyKey: validation.idempotency_key,
      });
    }

    return {
      ok: true,
      result_status: "committed",
      validation,
      receipt,
      metric_snapshot_record: metricSnapshotRecord,
      readback: readResearchCandidateManualGlobalDogfoodMetricSnapshot({
        scope: contract.scope,
        receiptId: receipt.receipt_id,
        limit: 1,
        db,
      }),
      refusal_reasons: [],
      duplicate_replayed: false,
      idempotency_key: validation.idempotency_key,
      authority_boundary: boundary,
      global_dogfood_metrics_written: false,
      next_work_bias_written: false,
      proof_or_evidence_rows_written: false,
      work_or_perspective_rows_written: false,
      perspective_memory_written: false,
      product_write_executed: false,
    };
  } finally {
    if (ownsDb && "close" in db && typeof db.close === "function") {
      db.close();
    }
  }
}

export function rollbackResearchCandidateManualGlobalDogfoodMetricSnapshotReceipt(
  request: unknown,
  options: { db?: MetricSnapshotDbLike } = {},
): ResearchCandidateManualGlobalDogfoodMetricSnapshotRollbackResult {
  const boundary =
    getResearchCandidateManualGlobalDogfoodMetricSnapshotWriteAuthorityBoundary();
  const refusalReasons = validateRollbackRequest(request);
  if (refusalReasons.length > 0 || !isRecord(request)) {
    return rollbackResult({
      ok: false,
      status: "refused",
      rollback: null,
      receipt: null,
      readback: null,
      refusalReasons,
    });
  }

  const typedRequest =
    request as unknown as ResearchCandidateManualGlobalDogfoodMetricSnapshotRollbackRequest;
  const db = options.db ?? (openDatabase() as unknown as MetricSnapshotDbLike);
  const ownsDb = !options.db;

  try {
    ensureResearchCandidateManualGlobalDogfoodMetricSnapshotSchema(db);
    const existing =
      readResearchCandidateManualGlobalDogfoodMetricSnapshotByReceiptId(
        typedRequest.receipt_id,
        { db },
      );
    if (!existing) {
      return rollbackResult({
        ok: false,
        status: "not_found",
        rollback: null,
        receipt: null,
        readback: readResearchCandidateManualGlobalDogfoodMetricSnapshot({ db }),
        refusalReasons: ["receipt_not_found"],
      });
    }
    if (existing.receipt.write_status === "rolled_back" && existing.rollback) {
      return rollbackResult({
        ok: true,
        status: "rolled_back",
        rollback: existing.rollback,
        receipt: existing.receipt,
        readback: readResearchCandidateManualGlobalDogfoodMetricSnapshot({
          receiptId: existing.receipt.receipt_id,
          db,
        }),
        refusalReasons: [],
      });
    }
    if (existing.receipt.write_status !== "committed") {
      return rollbackResult({
        ok: false,
        status: "refused",
        rollback: null,
        receipt: existing.receipt,
        readback: readResearchCandidateManualGlobalDogfoodMetricSnapshot({
          receiptId: existing.receipt.receipt_id,
          db,
        }),
        refusalReasons: ["receipt_not_committed"],
      });
    }

    const createdAt = new Date().toISOString();
    const rollback = buildRollbackRecord({
      receiptId: typedRequest.receipt_id,
      rollbackReason: typedRequest.rollback_authorization.rollback_reason,
      createdAt,
    });
    let transactionStarted = false;
    try {
      db.prepare("BEGIN IMMEDIATE").run();
      transactionStarted = true;
      insertRollback(db, rollback);
      const update = db
        .prepare(
          `
            UPDATE research_candidate_manual_global_dogfood_metric_snapshot_receipts
            SET write_status = 'rolled_back',
                rollback_of_receipt_id = receipt_id,
                rollback_reason = ?
            WHERE receipt_id = ?
              AND write_status = 'committed'
          `,
        )
        .run(rollback.rollback_reason, typedRequest.receipt_id);
      if (getRunChangeCount(update) !== 1) {
        rollbackWriteTransaction(db);
        transactionStarted = false;
        return rollbackResult({
          ok: false,
          status: "refused",
          rollback: null,
          receipt: existing.receipt,
          readback: readResearchCandidateManualGlobalDogfoodMetricSnapshot({
            receiptId: existing.receipt.receipt_id,
            db,
          }),
          refusalReasons: ["receipt_not_committed"],
        });
      }
      db.prepare("COMMIT").run();
      transactionStarted = false;
    } catch {
      if (transactionStarted) {
        rollbackWriteTransaction(db);
      }
      const replay =
        readResearchCandidateManualGlobalDogfoodMetricSnapshotByReceiptId(
          typedRequest.receipt_id,
          { db },
        );
      if (replay?.rollback) {
        return rollbackResult({
          ok: true,
          status: "rolled_back",
          rollback: replay.rollback,
          receipt: replay.receipt,
          readback: readResearchCandidateManualGlobalDogfoodMetricSnapshot({
            receiptId: replay.receipt.receipt_id,
            db,
          }),
          refusalReasons: [],
        });
      }
      return rollbackResult({
        ok: false,
        status: "refused",
        rollback: null,
        receipt: existing.receipt,
        readback: readResearchCandidateManualGlobalDogfoodMetricSnapshot({
          receiptId: existing.receipt.receipt_id,
          db,
        }),
        refusalReasons: ["rollback_transaction_failed"],
      });
    }

    const readback = readResearchCandidateManualGlobalDogfoodMetricSnapshot({
      receiptId: typedRequest.receipt_id,
      db,
    });
    return rollbackResult({
      ok: true,
      status: "rolled_back",
      rollback,
      receipt: readback.records_by_receipt[0]?.receipt ?? existing.receipt,
      readback,
      refusalReasons: [],
    });
  } finally {
    if (ownsDb && "close" in db && typeof db.close === "function") {
      db.close();
    }
  }

  function rollbackResult({
    ok,
    status,
    rollback,
    receipt,
    readback,
    refusalReasons,
  }: {
    ok: boolean;
    status: ResearchCandidateManualGlobalDogfoodMetricSnapshotRollbackResult["result_status"];
    rollback: ResearchCandidateManualGlobalDogfoodMetricSnapshotRollbackRecord | null;
    receipt: ResearchCandidateManualGlobalDogfoodMetricSnapshotWriteReceipt | null;
    readback: ResearchCandidateManualGlobalDogfoodMetricSnapshotRollbackResult["readback"];
    refusalReasons: string[];
  }): ResearchCandidateManualGlobalDogfoodMetricSnapshotRollbackResult {
    return {
      ok,
      result_status: status,
      rollback,
      receipt,
      readback,
      refusal_reasons: refusalReasons,
      authority_boundary: boundary,
      global_dogfood_metrics_written: false,
      next_work_bias_written: false,
      proof_or_evidence_rows_written: false,
      work_or_perspective_rows_written: false,
      perspective_memory_written: false,
      product_write_executed: false,
    };
  }
}

export function validateResearchCandidateManualGlobalDogfoodMetricSnapshotWriteRequest(
  request: unknown,
): ResearchCandidateManualGlobalDogfoodMetricSnapshotWriteValidation {
  const reasons: string[] = [];
  if (!isRecord(request)) {
    return validationResult({
      failureCodes: ["request_must_be_object"],
      idempotencyKey: null,
      request: null,
    });
  }

  const contract = isRecord(request.metric_snapshot_contract)
    ? (request.metric_snapshot_contract as unknown as ResearchCandidateManualGlobalDogfoodMetricSnapshotContract)
    : null;
  const review = isRecord(request.metric_snapshot_review)
    ? (request.metric_snapshot_review as unknown as ResearchCandidateManualGlobalDogfoodMetricSnapshotReview)
    : null;
  const operatorAuthorization = isRecord(request.operator_authorization)
    ? request.operator_authorization
    : null;

  if (!contract) reasons.push("metric_snapshot_contract_missing");
  if (!review) reasons.push("metric_snapshot_review_missing");
  if (!operatorAuthorization) reasons.push("operator_authorization_missing");

  if (contract) {
    reasons.push(...validateContract(contract));
  }
  if (review) {
    reasons.push(...validateReview(review));
  }
  if (operatorAuthorization) {
    reasons.push(...validateOperatorAuthorization(operatorAuthorization));
  }
  if (containsRawTextField(request)) {
    reasons.push("raw_text_or_operator_note_field_refused");
  }
  reasons.push(...validateRequestedSideEffects(request.requested_side_effects));

  const idempotencyKey =
    contract && review ? computeMetricSnapshotIdempotencyKey(contract, review) : null;
  return validationResult({
    failureCodes: uniqueStrings(reasons),
    idempotencyKey,
    request,
  });
}

function validateContract(
  contract: ResearchCandidateManualGlobalDogfoodMetricSnapshotContract,
) {
  const reasons: string[] = [];
  const mapping = contract.proposed_metric_snapshot_mapping;
  if (
    contract.operator_authorization_mode !==
    "ready_for_future_metric_snapshot_write_authorization"
  ) {
    reasons.push("metric_snapshot_contract_not_ready");
  }
  if (contract.validation.passed !== true) {
    reasons.push("metric_snapshot_contract_validation_not_passed");
  }
  if (contract.blocker_reasons.length > 0) {
    reasons.push("metric_snapshot_contract_blockers_present");
  }
  if (!contractNonWriteConfirmationStillClean(contract)) {
    reasons.push("metric_snapshot_contract_non_write_confirmation_invalid");
  }
  if (!contractAuthorityBoundaryStillReadOnly(contract)) {
    reasons.push("metric_snapshot_contract_authority_boundary_not_preview_only");
  }
  if (!hasText(contract.source_projection_fingerprint)) {
    reasons.push("source_projection_fingerprint_missing");
  }
  if (!hasText(contract.source_latest_active_committed_receipt_id)) {
    reasons.push("source_global_dogfood_ledger_receipt_id_missing");
  }
  if (!hasText(contract.source_ledger_record_ref)) {
    reasons.push("source_global_dogfood_ledger_record_id_missing");
  }
  if (!hasText(contract.source_manual_receipt_id)) {
    reasons.push("source_manual_receipt_id_missing");
  }
  if (!hasText(contract.source_handoff_seed_fingerprint)) {
    reasons.push("source_handoff_seed_fingerprint_missing");
  }
  if (!hasText(contract.source_result_text_fingerprint)) {
    reasons.push("source_result_text_fingerprint_missing");
  }
  if (!hasText(contract.source_expected_observed_delta_record_ref)) {
    reasons.push("source_expected_observed_delta_record_ref_missing");
  }
  if (!hasText(contract.source_reuse_outcome_record_ref)) {
    reasons.push("source_reuse_outcome_record_ref_missing");
  }
  if (
    mapping.outcome_label &&
    !SUPPORTED_OUTCOME_LABELS.has(mapping.outcome_label)
  ) {
    reasons.push("unsupported_outcome_label");
  }
  if (
    !mapping.outcome_signal ||
    !SUPPORTED_OUTCOME_SIGNALS.has(mapping.outcome_signal)
  ) {
    reasons.push("unsupported_outcome_signal");
  }
  if (mapping.can_feed_metric_snapshot_refresh_candidate !== true) {
    reasons.push("metric_snapshot_candidate_not_allowed");
  }
  if (mapping.can_write_metric_now !== false) {
    reasons.push("metric_snapshot_contract_unexpected_write_authority");
  }
  return reasons;
}

function validateReview(
  review: ResearchCandidateManualGlobalDogfoodMetricSnapshotReview,
) {
  const reasons: string[] = [];
  if (review.review_status !== "ready_for_future_metric_snapshot_write_slice") {
    reasons.push("metric_snapshot_review_not_ready_for_future_write_slice");
  }
  if (review.validation.passed !== true) {
    reasons.push("metric_snapshot_review_validation_not_passed");
  }
  if (review.validation.no_write_authority !== true) {
    reasons.push("metric_snapshot_review_no_write_authority_not_preserved");
  }
  if (
    review.operator_decision !==
    "accept_contract_for_future_metric_snapshot_write_slice"
  ) {
    reasons.push("metric_snapshot_review_operator_decision_not_accept");
  }
  if (review.validation.operator_note_persisted !== false) {
    reasons.push("metric_snapshot_review_operator_note_persisted");
  }
  if (!contractAuthorityBoundaryStillReadOnly({ authority_boundary: review.authority_boundary })) {
    reasons.push("metric_snapshot_review_authority_boundary_not_preview_only");
  }
  return reasons;
}

function validateOperatorAuthorization(operatorAuthorization: JsonRecord) {
  const reasons: string[] = [];
  if (
    operatorAuthorization.authorization_kind !==
    "manual_operator_authorized_dogfood_metric_snapshot_write"
  ) {
    reasons.push("operator_authorization_kind_invalid");
  }
  if (
    operatorAuthorization.operator_confirmation_text !==
    RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_METRIC_SNAPSHOT_WRITE_CONFIRMATION
  ) {
    reasons.push("operator_confirmation_text_invalid");
  }
  if (
    operatorAuthorization.write_mode !== "commit" &&
    operatorAuthorization.write_mode !== "replay_if_duplicate" &&
    operatorAuthorization.write_mode !== "supersede_previous"
  ) {
    reasons.push("write_mode_invalid");
  }
  if (
    operatorAuthorization.write_mode === "supersede_previous" &&
    !hasText(operatorAuthorization.supersedes_receipt_id)
  ) {
    reasons.push("supersedes_receipt_id_required");
  }
  return reasons;
}

function validateSourceManualGlobalDogfoodLedger({
  sourceLedger,
  contract,
}: {
  sourceLedger: ReturnType<typeof readResearchCandidateManualGlobalDogfoodLedgerByReceiptId>;
  contract: ResearchCandidateManualGlobalDogfoodMetricSnapshotContract;
}) {
  const reasons: string[] = [];
  if (!sourceLedger) {
    reasons.push("source_global_dogfood_ledger_receipt_not_found");
    return reasons;
  }
  if (sourceLedger.receipt.ledger_write_status !== "committed") {
    reasons.push("source_global_dogfood_ledger_receipt_not_active_committed");
  }
  if (!sourceLedger.ledger_record) {
    reasons.push("source_global_dogfood_ledger_record_missing");
    return reasons;
  }
  if (
    sourceLedger.receipt.receipt_id !==
    contract.source_latest_active_committed_receipt_id
  ) {
    reasons.push("source_global_dogfood_ledger_receipt_id_mismatch");
  }
  if (sourceLedger.ledger_record.ledger_record_id !== contract.source_ledger_record_ref) {
    reasons.push("source_global_dogfood_ledger_record_id_mismatch");
  }
  if (sourceLedger.receipt.source_manual_receipt_id !== contract.source_manual_receipt_id) {
    reasons.push("source_manual_receipt_id_mismatch");
  }
  if (
    sourceLedger.receipt.source_handoff_seed_fingerprint !==
    contract.source_handoff_seed_fingerprint
  ) {
    reasons.push("source_handoff_seed_fingerprint_mismatch");
  }
  if (
    sourceLedger.receipt.source_result_text_fingerprint !==
    contract.source_result_text_fingerprint
  ) {
    reasons.push("source_result_text_fingerprint_mismatch");
  }
  if (
    sourceLedger.receipt.source_expected_observed_delta_record_ref !==
    contract.source_expected_observed_delta_record_ref
  ) {
    reasons.push("source_expected_observed_delta_record_ref_mismatch");
  }
  if (
    sourceLedger.receipt.source_reuse_outcome_record_ref !==
    contract.source_reuse_outcome_record_ref
  ) {
    reasons.push("source_reuse_outcome_record_ref_mismatch");
  }
  if (
    sourceLedger.ledger_record.outcome_label !==
    contract.proposed_metric_snapshot_mapping.outcome_label
  ) {
    reasons.push("source_outcome_label_mismatch");
  }
  if (
    stableJson(sourceLedger.ledger_record.selected_candidate_context_refs) !==
    stableJson(contract.proposed_metric_dimensions.selected_candidate_context_refs)
  ) {
    reasons.push("source_selected_candidate_context_refs_mismatch");
  }
  return reasons;
}

function supersedePreviousReceipt({
  db,
  request,
}: {
  db: MetricSnapshotDbLike;
  request: ResearchCandidateManualGlobalDogfoodMetricSnapshotWriteRequest;
}) {
  const supersedesReceiptId =
    request.operator_authorization.supersedes_receipt_id ?? "";
  const target =
    readResearchCandidateManualGlobalDogfoodMetricSnapshotByReceiptId(
      supersedesReceiptId,
      { scope: request.metric_snapshot_contract.scope, db },
    );
  if (!target) return "supersedes_receipt_id_not_found";
  if (target.receipt.write_status !== "committed") {
    return "supersedes_receipt_not_committed";
  }
  const update = db
    .prepare(
      `
        UPDATE research_candidate_manual_global_dogfood_metric_snapshot_receipts
        SET write_status = 'superseded'
        WHERE receipt_id = ?
          AND scope = ?
          AND write_status = 'committed'
      `,
    )
    .run(supersedesReceiptId, request.metric_snapshot_contract.scope);
  return getRunChangeCount(update) === 1
    ? null
    : "supersedes_receipt_not_committed";
}

function validateSupersedeTargetForRequest({
  db,
  request,
  existingReceipt,
}: {
  db: MetricSnapshotDbLike;
  request: ResearchCandidateManualGlobalDogfoodMetricSnapshotWriteRequest;
  existingReceipt: ResearchCandidateManualGlobalDogfoodMetricSnapshotWriteReceipt | null;
}) {
  const supersedesReceiptId =
    request.operator_authorization.supersedes_receipt_id ?? "";
  const target =
    readResearchCandidateManualGlobalDogfoodMetricSnapshotByReceiptId(
      supersedesReceiptId,
      { scope: request.metric_snapshot_contract.scope, db },
    );
  if (!target) return "supersedes_receipt_id_not_found";
  if (target.receipt.write_status === "committed") return null;
  const exactPriorSupersedeReplay =
    existingReceipt?.supersedes_receipt_id === supersedesReceiptId &&
    target.receipt.write_status === "superseded";
  return exactPriorSupersedeReplay ? null : "supersedes_receipt_not_committed";
}

function buildReceipt({
  request,
  idempotencyKey,
  createdAt,
}: {
  request: ResearchCandidateManualGlobalDogfoodMetricSnapshotWriteRequest;
  idempotencyKey: string;
  createdAt: string;
}): ResearchCandidateManualGlobalDogfoodMetricSnapshotWriteReceipt {
  const contract = request.metric_snapshot_contract;
  const source = {
    scope: contract.scope,
    source_metric_contract_fingerprint: contract.validation.contract_fingerprint,
    source_metric_review_fingerprint:
      request.metric_snapshot_review.validation.review_fingerprint,
    source_projection_fingerprint: contract.source_projection_fingerprint,
    source_global_dogfood_ledger_receipt_id:
      contract.source_latest_active_committed_receipt_id!,
    source_global_dogfood_ledger_record_id: contract.source_ledger_record_ref!,
    source_manual_receipt_id: contract.source_manual_receipt_id!,
    source_handoff_seed_fingerprint: contract.source_handoff_seed_fingerprint!,
    source_result_text_fingerprint: contract.source_result_text_fingerprint!,
    source_expected_observed_delta_record_ref:
      contract.source_expected_observed_delta_record_ref!,
    source_reuse_outcome_record_ref: contract.source_reuse_outcome_record_ref!,
    idempotency_key: idempotencyKey,
    supersedes_receipt_id:
      request.operator_authorization.write_mode === "supersede_previous"
        ? request.operator_authorization.supersedes_receipt_id ?? null
        : null,
  };
  const receiptId = `manual-global-dogfood-metric-snapshot-receipt:${fingerprint({
    ...source,
    created_at: createdAt,
  })}`;
  return {
    receipt_id: receiptId,
    created_at: createdAt,
    scope: source.scope,
    source_metric_contract_fingerprint:
      source.source_metric_contract_fingerprint,
    source_metric_review_fingerprint: source.source_metric_review_fingerprint,
    source_projection_fingerprint: source.source_projection_fingerprint,
    source_global_dogfood_ledger_receipt_id:
      source.source_global_dogfood_ledger_receipt_id,
    source_global_dogfood_ledger_record_id:
      source.source_global_dogfood_ledger_record_id,
    source_manual_receipt_id: source.source_manual_receipt_id,
    source_handoff_seed_fingerprint: source.source_handoff_seed_fingerprint,
    source_result_text_fingerprint: source.source_result_text_fingerprint,
    source_expected_observed_delta_record_ref:
      source.source_expected_observed_delta_record_ref,
    source_reuse_outcome_record_ref: source.source_reuse_outcome_record_ref,
    idempotency_key: source.idempotency_key,
    write_status: "committed",
    authority_profile: AUTHORITY_PROFILE,
    receipt_fingerprint: fingerprint({ ...source, receipt_id: receiptId }),
    supersedes_receipt_id: source.supersedes_receipt_id,
    rollback_of_receipt_id: null,
    rollback_reason: null,
  };
}

function buildMetricSnapshotRecord({
  request,
  receipt,
  createdAt,
}: {
  request: ResearchCandidateManualGlobalDogfoodMetricSnapshotWriteRequest;
  receipt: ResearchCandidateManualGlobalDogfoodMetricSnapshotWriteReceipt;
  createdAt: string;
}): ResearchCandidateManualGlobalDogfoodMetricSnapshotRecord {
  const contract = request.metric_snapshot_contract;
  const sourceRefs = uniqueStrings([
    contract.source_projection_ref,
    contract.source_projection_fingerprint,
    contract.source_latest_active_committed_receipt_id,
    contract.source_ledger_record_ref,
    contract.source_manual_receipt_id,
    contract.source_contract_fingerprint,
    contract.source_authorization_review_fingerprint,
    contract.source_handoff_seed_fingerprint,
    contract.source_result_text_fingerprint,
    contract.source_expected_observed_delta_record_ref,
    contract.source_reuse_outcome_record_ref,
    contract.validation.contract_fingerprint,
    request.metric_snapshot_review.validation.review_fingerprint,
    ...contract.proposed_metric_dimensions.selected_candidate_context_refs,
  ]);
  const source = {
    receipt_id: receipt.receipt_id,
    scope: contract.scope,
    source_global_dogfood_ledger_receipt_id:
      contract.source_latest_active_committed_receipt_id!,
    source_global_dogfood_ledger_record_id: contract.source_ledger_record_ref!,
    source_projection_fingerprint: contract.source_projection_fingerprint,
    source_metric_contract_fingerprint: contract.validation.contract_fingerprint,
    source_metric_review_fingerprint:
      request.metric_snapshot_review.validation.review_fingerprint,
    outcome_label: contract.proposed_metric_snapshot_mapping.outcome_label!,
    outcome_signal: contract.proposed_metric_snapshot_mapping.outcome_signal!,
    proposed_metric_dimensions: contract.proposed_metric_dimensions,
    proposed_metric_counters: contract.proposed_metric_counters,
    proposed_metric_labels: contract.proposed_metric_labels,
    selected_candidate_context_refs:
      contract.proposed_metric_dimensions.selected_candidate_context_refs,
    expected_summary_present:
      contract.proposed_metric_snapshot_mapping.expected_summary_present,
    observed_summary_present:
      contract.proposed_metric_snapshot_mapping.observed_summary_present,
    mismatch_or_gap_present:
      contract.proposed_metric_snapshot_mapping.mismatch_or_gap_present,
    source_refs: sourceRefs,
    manual_only_context_refs:
      contract.proposed_metric_dimensions.manual_only_context_refs,
    warning_reasons: contract.warning_reasons,
    compatibility_findings: contract.compatibility_findings,
  };
  const recordId = `manual-global-dogfood-metric-snapshot-record:${fingerprint({
    ...source,
    created_at: createdAt,
  })}`;
  return {
    metric_snapshot_record_id: recordId,
    receipt_id: source.receipt_id,
    created_at: createdAt,
    scope: source.scope,
    source_global_dogfood_ledger_receipt_id:
      source.source_global_dogfood_ledger_receipt_id,
    source_global_dogfood_ledger_record_id:
      source.source_global_dogfood_ledger_record_id,
    source_projection_fingerprint: source.source_projection_fingerprint,
    source_metric_contract_fingerprint:
      source.source_metric_contract_fingerprint,
    source_metric_review_fingerprint: source.source_metric_review_fingerprint,
    outcome_label: source.outcome_label,
    outcome_signal: source.outcome_signal as "positive" | "negative" | "ambiguous",
    proposed_metric_dimensions: source.proposed_metric_dimensions,
    proposed_metric_counters: source.proposed_metric_counters,
    proposed_metric_labels: source.proposed_metric_labels,
    selected_candidate_context_refs: source.selected_candidate_context_refs,
    expected_summary_present: source.expected_summary_present,
    observed_summary_present: source.observed_summary_present,
    mismatch_or_gap_present: source.mismatch_or_gap_present,
    source_refs: source.source_refs,
    manual_only_context_refs: source.manual_only_context_refs,
    warning_reasons: source.warning_reasons,
    compatibility_findings: source.compatibility_findings,
    authority_profile: AUTHORITY_PROFILE,
    metric_snapshot_record_fingerprint: fingerprint({
      ...source,
      metric_snapshot_record_id: recordId,
    }),
  };
}

function buildRollbackRecord({
  receiptId,
  rollbackReason,
  createdAt,
}: {
  receiptId: string;
  rollbackReason: string;
  createdAt: string;
}): ResearchCandidateManualGlobalDogfoodMetricSnapshotRollbackRecord {
  const rollbackId = `manual-global-dogfood-metric-snapshot-rollback:${fingerprint({
    receipt_id: receiptId,
    rollback_reason: rollbackReason,
    created_at: createdAt,
  })}`;
  return {
    rollback_id: rollbackId,
    created_at: createdAt,
    receipt_id: receiptId,
    rollback_reason: rollbackReason,
    authority_profile: AUTHORITY_PROFILE,
    rollback_fingerprint: fingerprint({
      rollback_id: rollbackId,
      receipt_id: receiptId,
      rollback_reason: rollbackReason,
      authority_profile: AUTHORITY_PROFILE,
    }),
  };
}

function insertReceipt(
  db: MetricSnapshotDbLike,
  receipt: ResearchCandidateManualGlobalDogfoodMetricSnapshotWriteReceipt,
) {
  db.prepare(
    `
      INSERT INTO research_candidate_manual_global_dogfood_metric_snapshot_receipts (
        receipt_id,
        created_at,
        scope,
        source_metric_contract_fingerprint,
        source_metric_review_fingerprint,
        source_projection_fingerprint,
        source_global_dogfood_ledger_receipt_id,
        source_global_dogfood_ledger_record_id,
        source_manual_receipt_id,
        source_handoff_seed_fingerprint,
        source_result_text_fingerprint,
        source_expected_observed_delta_record_ref,
        source_reuse_outcome_record_ref,
        idempotency_key,
        write_status,
        authority_profile,
        receipt_fingerprint,
        supersedes_receipt_id,
        rollback_of_receipt_id,
        rollback_reason
      )
      VALUES (
        @receipt_id,
        @created_at,
        @scope,
        @source_metric_contract_fingerprint,
        @source_metric_review_fingerprint,
        @source_projection_fingerprint,
        @source_global_dogfood_ledger_receipt_id,
        @source_global_dogfood_ledger_record_id,
        @source_manual_receipt_id,
        @source_handoff_seed_fingerprint,
        @source_result_text_fingerprint,
        @source_expected_observed_delta_record_ref,
        @source_reuse_outcome_record_ref,
        @idempotency_key,
        @write_status,
        @authority_profile,
        @receipt_fingerprint,
        @supersedes_receipt_id,
        @rollback_of_receipt_id,
        @rollback_reason
      )
    `,
  ).run(receipt);
}

function insertMetricSnapshotRecord(
  db: MetricSnapshotDbLike,
  record: ResearchCandidateManualGlobalDogfoodMetricSnapshotRecord,
) {
  db.prepare(
    `
      INSERT INTO research_candidate_manual_global_dogfood_metric_snapshot_records (
        metric_snapshot_record_id,
        receipt_id,
        created_at,
        scope,
        source_global_dogfood_ledger_receipt_id,
        source_global_dogfood_ledger_record_id,
        source_projection_fingerprint,
        source_metric_contract_fingerprint,
        source_metric_review_fingerprint,
        outcome_label,
        outcome_signal,
        proposed_metric_dimensions_json,
        proposed_metric_counters_json,
        proposed_metric_labels_json,
        selected_candidate_context_refs_json,
        expected_summary_present,
        observed_summary_present,
        mismatch_or_gap_present,
        source_refs_json,
        manual_only_context_refs_json,
        warning_reasons_json,
        compatibility_findings_json,
        authority_profile,
        metric_snapshot_record_fingerprint
      )
      VALUES (
        @metric_snapshot_record_id,
        @receipt_id,
        @created_at,
        @scope,
        @source_global_dogfood_ledger_receipt_id,
        @source_global_dogfood_ledger_record_id,
        @source_projection_fingerprint,
        @source_metric_contract_fingerprint,
        @source_metric_review_fingerprint,
        @outcome_label,
        @outcome_signal,
        @proposed_metric_dimensions_json,
        @proposed_metric_counters_json,
        @proposed_metric_labels_json,
        @selected_candidate_context_refs_json,
        @expected_summary_present,
        @observed_summary_present,
        @mismatch_or_gap_present,
        @source_refs_json,
        @manual_only_context_refs_json,
        @warning_reasons_json,
        @compatibility_findings_json,
        @authority_profile,
        @metric_snapshot_record_fingerprint
      )
    `,
  ).run({
    ...record,
    proposed_metric_dimensions_json: JSON.stringify(
      record.proposed_metric_dimensions,
    ),
    proposed_metric_counters_json: JSON.stringify(record.proposed_metric_counters),
    proposed_metric_labels_json: JSON.stringify(record.proposed_metric_labels),
    selected_candidate_context_refs_json: JSON.stringify(
      record.selected_candidate_context_refs,
    ),
    expected_summary_present: record.expected_summary_present ? 1 : 0,
    observed_summary_present: record.observed_summary_present ? 1 : 0,
    mismatch_or_gap_present: record.mismatch_or_gap_present ? 1 : 0,
    source_refs_json: JSON.stringify(record.source_refs),
    manual_only_context_refs_json: JSON.stringify(record.manual_only_context_refs),
    warning_reasons_json: JSON.stringify(record.warning_reasons),
    compatibility_findings_json: JSON.stringify(record.compatibility_findings),
  });
}

function insertRollback(
  db: MetricSnapshotDbLike,
  rollback: ResearchCandidateManualGlobalDogfoodMetricSnapshotRollbackRecord,
) {
  db.prepare(
    `
      INSERT INTO research_candidate_manual_global_dogfood_metric_snapshot_rollbacks (
        rollback_id,
        created_at,
        receipt_id,
        rollback_reason,
        authority_profile,
        rollback_fingerprint
      )
      VALUES (
        @rollback_id,
        @created_at,
        @receipt_id,
        @rollback_reason,
        @authority_profile,
        @rollback_fingerprint
      )
    `,
  ).run(rollback);
}

function duplicateReplayResult({
  validation,
  readback,
}: {
  validation: ResearchCandidateManualGlobalDogfoodMetricSnapshotWriteValidation;
  readback: ReturnType<typeof readResearchCandidateManualGlobalDogfoodMetricSnapshot>;
}): ResearchCandidateManualGlobalDogfoodMetricSnapshotWriteResult {
  const existing = readback.records_by_receipt[0];
  return {
    ok: true,
    result_status: "duplicate_replayed",
    validation,
    receipt: existing?.receipt ?? null,
    metric_snapshot_record: existing?.metric_snapshot_record ?? null,
    readback,
    refusal_reasons: [],
    duplicate_replayed: true,
    idempotency_key: validation.idempotency_key,
    authority_boundary:
      getResearchCandidateManualGlobalDogfoodMetricSnapshotWriteAuthorityBoundary(),
    global_dogfood_metrics_written: false,
    next_work_bias_written: false,
    proof_or_evidence_rows_written: false,
    work_or_perspective_rows_written: false,
    perspective_memory_written: false,
    product_write_executed: false,
  };
}

function refusedResult({
  validation,
  idempotencyKey,
}: {
  validation: ResearchCandidateManualGlobalDogfoodMetricSnapshotWriteValidation;
  idempotencyKey: string | null;
}): ResearchCandidateManualGlobalDogfoodMetricSnapshotWriteResult {
  return {
    ok: false,
    result_status: "refused",
    validation,
    receipt: null,
    metric_snapshot_record: null,
    readback: null,
    refusal_reasons: validation.failure_codes,
    duplicate_replayed: false,
    idempotency_key: idempotencyKey,
    authority_boundary:
      getResearchCandidateManualGlobalDogfoodMetricSnapshotWriteAuthorityBoundary(),
    global_dogfood_metrics_written: false,
    next_work_bias_written: false,
    proof_or_evidence_rows_written: false,
    work_or_perspective_rows_written: false,
    perspective_memory_written: false,
    product_write_executed: false,
  };
}

function validationResult({
  failureCodes,
  idempotencyKey,
  request,
}: {
  failureCodes: string[];
  idempotencyKey: string | null;
  request: JsonRecord | null;
}): ResearchCandidateManualGlobalDogfoodMetricSnapshotWriteValidation {
  const uniqueFailureCodes = uniqueStrings(failureCodes);
  return {
    passed: uniqueFailureCodes.length === 0,
    failure_codes: uniqueFailureCodes,
    idempotency_key: idempotencyKey,
    exact_operator_confirmation_present:
      isRecord(request?.operator_authorization) &&
      request?.operator_authorization.operator_confirmation_text ===
        RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_METRIC_SNAPSHOT_WRITE_CONFIRMATION,
    ready_metric_contract_present:
      isRecord(request?.metric_snapshot_contract) &&
      request?.metric_snapshot_contract.operator_authorization_mode ===
        "ready_for_future_metric_snapshot_write_authorization",
    accepted_metric_review_present:
      isRecord(request?.metric_snapshot_review) &&
      request?.metric_snapshot_review.review_status ===
        "ready_for_future_metric_snapshot_write_slice",
    preview_contract_remained_non_writing:
      isRecord(request?.metric_snapshot_contract) &&
      contractNonWriteConfirmationStillClean(
        request.metric_snapshot_contract as unknown as ResearchCandidateManualGlobalDogfoodMetricSnapshotContract,
      ),
    preview_authority_boundary_was_read_only:
      isRecord(request?.metric_snapshot_contract) &&
      contractAuthorityBoundaryStillReadOnly(
        request.metric_snapshot_contract as unknown as Pick<
          ResearchCandidateManualGlobalDogfoodMetricSnapshotContract,
          "authority_boundary"
        >,
      ),
    writer_authority_boundary_is_narrow: writerAuthorityBoundaryIsNarrow(),
    raw_text_fields_absent: !containsRawTextField(request),
    operator_note_absent: !containsOperatorNoteField(request),
    source_refs_present:
      isRecord(request?.metric_snapshot_contract) &&
      sourceRefsPresent(
        request.metric_snapshot_contract as unknown as ResearchCandidateManualGlobalDogfoodMetricSnapshotContract,
      ),
    source_global_dogfood_ledger_receipt_active_committed:
      !uniqueFailureCodes.includes(
        "source_global_dogfood_ledger_receipt_not_active_committed",
      ) &&
      !uniqueFailureCodes.includes(
        "source_global_dogfood_ledger_receipt_not_found",
      ),
    source_global_dogfood_ledger_record_matches_contract:
      !uniqueFailureCodes.some((code) => /mismatch|missing/.test(code)),
    supported_outcome_signal:
      isRecord(request?.metric_snapshot_contract) &&
      SUPPORTED_OUTCOME_SIGNALS.has(
        String(
          (
            request.metric_snapshot_contract as unknown as ResearchCandidateManualGlobalDogfoodMetricSnapshotContract
          ).proposed_metric_snapshot_mapping.outcome_signal,
        ),
      ),
  };
}

function validationWithFailures(
  validation: ResearchCandidateManualGlobalDogfoodMetricSnapshotWriteValidation,
  failureCodes: string[],
): ResearchCandidateManualGlobalDogfoodMetricSnapshotWriteValidation {
  const uniqueFailureCodes = uniqueStrings([
    ...validation.failure_codes,
    ...failureCodes,
  ]);
  return {
    ...validation,
    passed: false,
    failure_codes: uniqueFailureCodes,
    source_global_dogfood_ledger_receipt_active_committed:
      validation.source_global_dogfood_ledger_receipt_active_committed &&
      !uniqueFailureCodes.includes(
        "source_global_dogfood_ledger_receipt_not_active_committed",
      ) &&
      !uniqueFailureCodes.includes(
        "source_global_dogfood_ledger_receipt_not_found",
      ),
    source_global_dogfood_ledger_record_matches_contract:
      validation.source_global_dogfood_ledger_record_matches_contract &&
      !uniqueFailureCodes.some((code) => /mismatch|record_missing/.test(code)),
  };
}

function computeMetricSnapshotIdempotencyKey(
  contract: ResearchCandidateManualGlobalDogfoodMetricSnapshotContract,
  review: ResearchCandidateManualGlobalDogfoodMetricSnapshotReview,
) {
  return `manual-global-dogfood-metric-snapshot:${fingerprint({
    write_version:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_METRIC_SNAPSHOT_WRITE_VERSION,
    metric_contract_fingerprint: contract.validation.contract_fingerprint,
    metric_review_fingerprint: review.validation.review_fingerprint,
    source_projection_fingerprint: contract.source_projection_fingerprint,
    source_global_dogfood_ledger_receipt_id:
      contract.source_latest_active_committed_receipt_id,
    source_global_dogfood_ledger_record_id: contract.source_ledger_record_ref,
    source_manual_receipt_id: contract.source_manual_receipt_id,
    source_handoff_seed_fingerprint: contract.source_handoff_seed_fingerprint,
    source_result_text_fingerprint: contract.source_result_text_fingerprint,
    source_expected_observed_delta_record_ref:
      contract.source_expected_observed_delta_record_ref,
    source_reuse_outcome_record_ref: contract.source_reuse_outcome_record_ref,
    outcome_label: contract.proposed_metric_snapshot_mapping.outcome_label,
    outcome_signal: contract.proposed_metric_snapshot_mapping.outcome_signal,
    selected_candidate_context_refs:
      contract.proposed_metric_dimensions.selected_candidate_context_refs,
    proposed_metric_counters: contract.proposed_metric_counters,
  })}`;
}

function validateRollbackRequest(request: unknown) {
  const reasons: string[] = [];
  if (!isRecord(request)) return ["request_must_be_object"];
  if (!hasText(request.receipt_id)) reasons.push("receipt_id_missing");
  const rollbackAuthorization = isRecord(request.rollback_authorization)
    ? request.rollback_authorization
    : null;
  if (!rollbackAuthorization) {
    reasons.push("rollback_authorization_missing");
    return reasons;
  }
  if (
    rollbackAuthorization.authorization_kind !==
    "manual_operator_authorized_dogfood_metric_snapshot_rollback"
  ) {
    reasons.push("rollback_authorization_kind_invalid");
  }
  if (
    rollbackAuthorization.operator_confirmation_text !==
    RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_METRIC_SNAPSHOT_ROLLBACK_CONFIRMATION
  ) {
    reasons.push("rollback_confirmation_text_invalid");
  }
  if (!hasText(rollbackAuthorization.rollback_reason)) {
    reasons.push("rollback_reason_missing");
  }
  if (containsRawTextField(request)) {
    reasons.push("raw_text_or_operator_note_field_refused");
  }
  return uniqueStrings(reasons);
}

function contractNonWriteConfirmationStillClean(
  contract: Pick<
    ResearchCandidateManualGlobalDogfoodMetricSnapshotContract,
    "non_write_confirmation"
  >,
) {
  const confirmation = contract.non_write_confirmation;
  return (
    confirmation.dogfood_metrics_written === false &&
    confirmation.metric_snapshot_written === false &&
    confirmation.next_work_bias_written === false &&
    confirmation.global_dogfood_ledger_written === false &&
    confirmation.proof_or_evidence_written === false &&
    confirmation.work_mutated === false &&
    confirmation.perspective_state_written === false &&
    confirmation.perspective_memory_written === false &&
    confirmation.product_write_executed === false &&
    confirmation.operator_note_persisted === false
  );
}

function contractAuthorityBoundaryStillReadOnly(
  contract: Pick<
    ResearchCandidateManualGlobalDogfoodMetricSnapshotContract,
    "authority_boundary"
  >,
) {
  const boundary = contract.authority_boundary;
  return (
    boundary.preview_only === true &&
    boundary.read_only === true &&
    boundary.source_of_truth === false &&
    boundary.can_write_dogfood_metrics === false &&
    boundary.can_write_metric_snapshot === false &&
    boundary.can_write_global_dogfood_ledger === false &&
    boundary.can_write_next_work_bias === false &&
    boundary.can_write_perspective_state === false &&
    boundary.can_promote_perspective === false &&
    boundary.can_write_perspective_memory === false &&
    boundary.can_write_proof_or_evidence === false &&
    boundary.can_mutate_work === false &&
    boundary.can_execute_codex === false &&
    boundary.can_call_github === false &&
    boundary.can_call_providers_or_openai === false &&
    boundary.can_fetch_sources === false &&
    boundary.can_run_retrieval_rag_embeddings_vector_fts_or_crawler === false &&
    boundary.can_execute_product_write === false
  );
}

function writerAuthorityBoundaryIsNarrow() {
  const boundary =
    getResearchCandidateManualGlobalDogfoodMetricSnapshotWriteAuthorityBoundary();
  return (
    boundary.can_write_dogfood_metric_snapshot_record === true &&
    boundary.can_write_dogfood_metric_snapshot_receipt === true &&
    boundary.can_write_metric_snapshot_rollback_metadata === true &&
    boundary.can_write_global_dogfood_metrics === false &&
    boundary.can_write_next_work_bias === false &&
    boundary.can_write_global_dogfood_ledger === false &&
    boundary.can_mutate_manual_global_dogfood_ledger === false &&
    boundary.can_write_perspective_state === false &&
    boundary.can_write_perspective_memory === false &&
    boundary.can_write_proof_or_evidence === false &&
    boundary.can_mutate_work === false &&
    boundary.can_execute_product_write === false
  );
}

function sourceRefsPresent(
  contract: ResearchCandidateManualGlobalDogfoodMetricSnapshotContract,
) {
  return Boolean(
    hasText(contract.source_projection_fingerprint) &&
      hasText(contract.source_latest_active_committed_receipt_id) &&
      hasText(contract.source_ledger_record_ref) &&
      hasText(contract.source_manual_receipt_id) &&
      hasText(contract.source_handoff_seed_fingerprint) &&
      hasText(contract.source_result_text_fingerprint) &&
      hasText(contract.source_expected_observed_delta_record_ref) &&
      hasText(contract.source_reuse_outcome_record_ref),
  );
}

function validateRequestedSideEffects(value: unknown) {
  if (value === undefined) return [];
  if (!isRecord(value)) return ["requested_side_effects_must_be_object"];
  const reasons: string[] = [];
  for (const [key, sideEffectValue] of Object.entries(value)) {
    if (sideEffectValue !== false) {
      reasons.push("requested_side_effects_must_be_false_for_metric_write");
    }
    if (
      FORBIDDEN_SIDE_EFFECT_KEYS.some((pattern) =>
        pattern.test(`${key}:${String(sideEffectValue)}`),
      )
    ) {
      reasons.push("requested_forbidden_side_effect_refused");
    }
  }
  return uniqueStrings(reasons);
}

function containsRawTextField(value: unknown): boolean {
  const seen = new Set<unknown>();
  const visit = (item: unknown): boolean => {
    if (item === null || item === undefined) return false;
    if (typeof item !== "object") {
      return typeof item === "string" && /raw_(manual|result|report|text)/i.test(item);
    }
    if (seen.has(item)) return false;
    seen.add(item);
    if (Array.isArray(item)) return item.some(visit);
    return Object.entries(item).some(([key, nested]) => {
      if (RAW_TEXT_KEYS.has(key) || /raw_(manual|result|report|text)/i.test(key)) {
        return true;
      }
      return visit(nested);
    });
  };
  return visit(value);
}

function containsOperatorNoteField(value: unknown): boolean {
  const seen = new Set<unknown>();
  const visit = (item: unknown): boolean => {
    if (item === null || item === undefined || typeof item !== "object") {
      return false;
    }
    if (seen.has(item)) return false;
    seen.add(item);
    if (Array.isArray(item)) return item.some(visit);
    return Object.entries(item).some(
      ([key, nested]) =>
        /operator_note|operator_notes|raw_operator_notes/i.test(key) ||
        visit(nested),
    );
  };
  return visit(value);
}

function rollbackWriteTransaction(db: MetricSnapshotDbLike) {
  try {
    db.prepare("ROLLBACK").run();
  } catch {
    // The caller returns a refusal or replay result.
  }
}

function getRunChangeCount(result: unknown) {
  if (
    result &&
    typeof result === "object" &&
    "changes" in result &&
    typeof result.changes === "number"
  ) {
    return result.changes;
  }
  return null;
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function fingerprint(value: unknown) {
  return `${FINGERPRINT_ALGORITHM}:${fnv1a32(stableJson(value))}`;
}

function stableJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableJson(item)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
    .join(",")}}`;
}

function fnv1a32(value: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
