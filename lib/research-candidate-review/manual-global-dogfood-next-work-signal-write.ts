import { openDatabase } from "@/lib/db";
import {
  ensureResearchCandidateManualGlobalDogfoodLedgerSchema,
  readResearchCandidateManualGlobalDogfoodLedgerByReceiptId,
  type ResearchCandidateManualGlobalDogfoodLedgerDbLike,
} from "@/lib/research-candidate-review/read-manual-global-dogfood-ledger";
import {
  ensureResearchCandidateManualGlobalDogfoodMetricSnapshotSchema,
  readResearchCandidateManualGlobalDogfoodMetricSnapshotByReceiptId,
  type ResearchCandidateManualGlobalDogfoodMetricSnapshotDbLike,
} from "@/lib/research-candidate-review/read-manual-global-dogfood-metric-snapshot";
import {
  ensureResearchCandidateManualGlobalDogfoodNextWorkSignalSchema,
  getResearchCandidateManualGlobalDogfoodNextWorkSignalWriteAuthorityBoundary,
  readResearchCandidateManualGlobalDogfoodNextWorkSignal,
  readResearchCandidateManualGlobalDogfoodNextWorkSignalByReceiptId,
  type ResearchCandidateManualGlobalDogfoodNextWorkSignalDbLike,
} from "@/lib/research-candidate-review/read-manual-global-dogfood-next-work-signal";
import type {
  ResearchCandidateManualGlobalDogfoodNextWorkSignalContract,
} from "@/types/research-candidate-manual-global-dogfood-next-work-signal-contract";
import type {
  ResearchCandidateManualGlobalDogfoodNextWorkSignalReview,
} from "@/types/research-candidate-manual-global-dogfood-next-work-signal-review";
import {
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_SIGNAL_ROLLBACK_CONFIRMATION,
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_SIGNAL_WRITE_CONFIRMATION,
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_SIGNAL_WRITE_VERSION,
  type ResearchCandidateManualGlobalDogfoodNextWorkSignalRecord,
  type ResearchCandidateManualGlobalDogfoodNextWorkSignalRollbackRecord,
  type ResearchCandidateManualGlobalDogfoodNextWorkSignalRollbackRequest,
  type ResearchCandidateManualGlobalDogfoodNextWorkSignalRollbackResult,
  type ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteReceipt,
  type ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteRequest,
  type ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteResult,
  type ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteValidation,
} from "@/types/research-candidate-manual-global-dogfood-next-work-signal-write";

type JsonRecord = Record<string, unknown>;
type NextWorkSignalDbLike =
  ResearchCandidateManualGlobalDogfoodNextWorkSignalDbLike &
    ResearchCandidateManualGlobalDogfoodLedgerDbLike &
    ResearchCandidateManualGlobalDogfoodMetricSnapshotDbLike;

const AUTHORITY_PROFILE =
  "manual_research_candidate_global_dogfood_next_work_signal_write.v0.1" as const;
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
  /next.*work.*bias/i,
  /work.*item|work.*event|work.*status|mutate.*work/i,
  /perspective/i,
  /memory/i,
  /proof|evidence/i,
  /dogfood.*metrics|global.*metric/i,
  /global.*dogfood.*ledger/i,
  /metric.*snapshot.*(write|mutate|update)/i,
  /product|delivery/i,
  /provider|openai/i,
  /github/i,
  /codex/i,
  /retrieval|rag|embedding|vector|fts|crawler|source.*fetch/i,
] as const;

export function writeResearchCandidateManualGlobalDogfoodNextWorkSignal(
  request: unknown,
  options: { db?: NextWorkSignalDbLike } = {},
): ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteResult {
  const validation =
    validateResearchCandidateManualGlobalDogfoodNextWorkSignalWriteRequest(
      request,
    );
  const boundary =
    getResearchCandidateManualGlobalDogfoodNextWorkSignalWriteAuthorityBoundary();
  if (!validation.passed || !isRecord(request)) {
    return refusedResult({
      validation,
      idempotencyKey: validation.idempotency_key,
    });
  }

  const typedRequest =
    request as unknown as ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteRequest;
  const contract = typedRequest.next_work_signal_contract;
  const db = options.db ?? (openDatabase() as unknown as NextWorkSignalDbLike);
  const ownsDb = !options.db;

  try {
    ensureResearchCandidateManualGlobalDogfoodLedgerSchema(db);
    ensureResearchCandidateManualGlobalDogfoodMetricSnapshotSchema(db);
    ensureResearchCandidateManualGlobalDogfoodNextWorkSignalSchema(db);

    const sourceLedger = readResearchCandidateManualGlobalDogfoodLedgerByReceiptId(
      contract.source_latest_active_committed_receipt_id!,
      { scope: contract.scope, db },
    );
    const sourceMetric =
      readResearchCandidateManualGlobalDogfoodMetricSnapshotByReceiptId(
        typedRequest.source_metric_snapshot_receipt_id!,
        { scope: contract.scope, db },
      );
    const sourceFailures = [
      ...validateSourceManualGlobalDogfoodLedger({ sourceLedger, contract }),
      ...validateSourceManualGlobalDogfoodMetricSnapshot({
        sourceMetric,
        request: typedRequest,
      }),
    ];
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
    const nextWorkSignalRecord = buildNextWorkSignalRecord({
      request: typedRequest,
      receipt,
      createdAt,
      manualOnlyContextRefs:
        sourceMetric?.metric_snapshot_record?.manual_only_context_refs ?? [],
    });

    let transactionStarted = false;
    try {
      db.prepare("BEGIN IMMEDIATE").run();
      transactionStarted = true;

      const existingReadback =
        readResearchCandidateManualGlobalDogfoodNextWorkSignal({
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
        return duplicateReplayResult({ validation, readback: existingReadback });
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

      const transactionalSourceLedger =
        readResearchCandidateManualGlobalDogfoodLedgerByReceiptId(
          contract.source_latest_active_committed_receipt_id!,
          { scope: contract.scope, db },
        );
      const transactionalSourceMetric =
        readResearchCandidateManualGlobalDogfoodMetricSnapshotByReceiptId(
          typedRequest.source_metric_snapshot_receipt_id!,
          { scope: contract.scope, db },
        );
      const transactionalSourceFailures = [
        ...validateSourceManualGlobalDogfoodLedger({
          sourceLedger: transactionalSourceLedger,
          contract,
        }),
        ...validateSourceManualGlobalDogfoodMetricSnapshot({
          sourceMetric: transactionalSourceMetric,
          request: typedRequest,
        }),
      ];
      if (transactionalSourceFailures.length > 0) {
        rollbackWriteTransaction(db);
        transactionStarted = false;
        return refusedResult({
          validation: validationWithFailures(
            validation,
            transactionalSourceFailures,
          ),
          idempotencyKey: validation.idempotency_key,
        });
      }

      insertReceipt(db, receipt);
      insertNextWorkSignalRecord(db, nextWorkSignalRecord);
      db.prepare("COMMIT").run();
      transactionStarted = false;
    } catch {
      if (transactionStarted) {
        rollbackWriteTransaction(db);
      }
      const duplicateReadback =
        readResearchCandidateManualGlobalDogfoodNextWorkSignal({
          scope: contract.scope,
          idempotencyKey: validation.idempotency_key,
          limit: 1,
          db,
        });
      if (duplicateReadback.records_by_receipt[0]) {
        return duplicateReplayResult({ validation, readback: duplicateReadback });
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
      next_work_signal_record: nextWorkSignalRecord,
      readback: readResearchCandidateManualGlobalDogfoodNextWorkSignal({
        scope: contract.scope,
        receiptId: receipt.receipt_id,
        limit: 1,
        db,
      }),
      refusal_reasons: [],
      duplicate_replayed: false,
      idempotency_key: validation.idempotency_key,
      authority_boundary: boundary,
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
    if (ownsDb && "close" in db && typeof db.close === "function") {
      db.close();
    }
  }
}

export function rollbackResearchCandidateManualGlobalDogfoodNextWorkSignalReceipt(
  request: unknown,
  options: { db?: NextWorkSignalDbLike } = {},
): ResearchCandidateManualGlobalDogfoodNextWorkSignalRollbackResult {
  const boundary =
    getResearchCandidateManualGlobalDogfoodNextWorkSignalWriteAuthorityBoundary();
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
    request as unknown as ResearchCandidateManualGlobalDogfoodNextWorkSignalRollbackRequest;
  const db = options.db ?? (openDatabase() as unknown as NextWorkSignalDbLike);
  const ownsDb = !options.db;

  try {
    ensureResearchCandidateManualGlobalDogfoodNextWorkSignalSchema(db);
    const existing =
      readResearchCandidateManualGlobalDogfoodNextWorkSignalByReceiptId(
        typedRequest.receipt_id,
        { db },
      );
    if (!existing) {
      return rollbackResult({
        ok: false,
        status: "not_found",
        rollback: null,
        receipt: null,
        readback: readResearchCandidateManualGlobalDogfoodNextWorkSignal({ db }),
        refusalReasons: ["receipt_not_found"],
      });
    }
    if (existing.receipt.write_status === "rolled_back" && existing.rollback) {
      return rollbackResult({
        ok: true,
        status: "rolled_back",
        rollback: existing.rollback,
        receipt: existing.receipt,
        readback: readResearchCandidateManualGlobalDogfoodNextWorkSignal({
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
        readback: readResearchCandidateManualGlobalDogfoodNextWorkSignal({
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
            UPDATE research_candidate_manual_global_dogfood_next_work_signal_receipts
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
          readback: readResearchCandidateManualGlobalDogfoodNextWorkSignal({
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
        readResearchCandidateManualGlobalDogfoodNextWorkSignalByReceiptId(
          typedRequest.receipt_id,
          { db },
        );
      if (replay?.rollback) {
        return rollbackResult({
          ok: true,
          status: "rolled_back",
          rollback: replay.rollback,
          receipt: replay.receipt,
          readback: readResearchCandidateManualGlobalDogfoodNextWorkSignal({
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
        readback: readResearchCandidateManualGlobalDogfoodNextWorkSignal({
          receiptId: existing.receipt.receipt_id,
          db,
        }),
        refusalReasons: ["rollback_transaction_failed"],
      });
    }

    const readback = readResearchCandidateManualGlobalDogfoodNextWorkSignal({
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
    status: ResearchCandidateManualGlobalDogfoodNextWorkSignalRollbackResult["result_status"];
    rollback: ResearchCandidateManualGlobalDogfoodNextWorkSignalRollbackRecord | null;
    receipt: ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteReceipt | null;
    readback: ResearchCandidateManualGlobalDogfoodNextWorkSignalRollbackResult["readback"];
    refusalReasons: string[];
  }): ResearchCandidateManualGlobalDogfoodNextWorkSignalRollbackResult {
    return {
      ok,
      result_status: status,
      rollback,
      receipt,
      readback,
      refusal_reasons: refusalReasons,
      authority_boundary: boundary,
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
}

export function validateResearchCandidateManualGlobalDogfoodNextWorkSignalWriteRequest(
  request: unknown,
): ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteValidation {
  const reasons: string[] = [];
  if (!isRecord(request)) {
    return validationResult({
      failureCodes: ["request_must_be_object"],
      idempotencyKey: null,
      request: null,
    });
  }

  const contract = isRecord(request.next_work_signal_contract)
    ? (request.next_work_signal_contract as unknown as ResearchCandidateManualGlobalDogfoodNextWorkSignalContract)
    : null;
  const review = isRecord(request.next_work_signal_review)
    ? (request.next_work_signal_review as unknown as ResearchCandidateManualGlobalDogfoodNextWorkSignalReview)
    : null;
  const operatorAuthorization = isRecord(request.operator_authorization)
    ? request.operator_authorization
    : null;
  const sourceMetricReceiptId =
    typeof request.source_metric_snapshot_receipt_id === "string"
      ? request.source_metric_snapshot_receipt_id
      : null;
  const sourceMetricRecordId =
    typeof request.source_metric_snapshot_record_id === "string"
      ? request.source_metric_snapshot_record_id
      : null;

  if (!contract) reasons.push("next_work_signal_contract_missing");
  if (!review) reasons.push("next_work_signal_review_missing");
  if (!operatorAuthorization) reasons.push("operator_authorization_missing");
  if (!hasText(sourceMetricReceiptId)) {
    reasons.push("source_metric_snapshot_receipt_id_missing");
  }
  if (!hasText(sourceMetricRecordId)) {
    reasons.push("source_metric_snapshot_record_id_missing");
  }

  if (contract) reasons.push(...validateContract(contract));
  if (review) reasons.push(...validateReview(review));
  if (operatorAuthorization) {
    reasons.push(...validateOperatorAuthorization(operatorAuthorization));
  }
  if (containsRawTextField(request)) {
    reasons.push("raw_text_or_operator_note_field_refused");
  }
  reasons.push(...validateRequestedSideEffects(request.requested_side_effects));

  const idempotencyKey =
    contract && review && sourceMetricReceiptId && sourceMetricRecordId
      ? computeNextWorkSignalIdempotencyKey({
          contract,
          review,
          sourceMetricReceiptId,
          sourceMetricRecordId,
        })
      : null;
  return validationResult({
    failureCodes: uniqueStrings(reasons),
    idempotencyKey,
    request,
  });
}

function validateContract(
  contract: ResearchCandidateManualGlobalDogfoodNextWorkSignalContract,
) {
  const reasons: string[] = [];
  const mapping = contract.proposed_next_work_signal_mapping;
  if (
    contract.operator_authorization_mode !==
    "ready_for_future_next_work_signal_write_authorization"
  ) {
    reasons.push("next_work_signal_contract_not_ready");
  }
  if (contract.validation.passed !== true) {
    reasons.push("next_work_signal_contract_validation_not_passed");
  }
  if (contract.blocker_reasons.length > 0) {
    reasons.push("next_work_signal_contract_blockers_present");
  }
  if (!contractNonWriteConfirmationStillClean(contract)) {
    reasons.push("next_work_signal_contract_non_write_confirmation_invalid");
  }
  if (!contractAuthorityBoundaryStillReadOnly(contract)) {
    reasons.push("next_work_signal_contract_authority_boundary_not_preview_only");
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
  if (contract.source_next_work_candidate_card_ids.length === 0) {
    reasons.push("source_next_work_candidate_card_ids_missing");
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
  if (mapping.can_feed_next_work_signal_decision_candidate !== true) {
    reasons.push("next_work_signal_candidate_not_allowed");
  }
  if (mapping.can_write_next_work_bias_now !== false) {
    reasons.push("next_work_signal_contract_unexpected_next_work_bias_authority");
  }
  if (mapping.can_write_perspective_now !== false) {
    reasons.push("next_work_signal_contract_unexpected_perspective_authority");
  }
  if (
    contract.proposed_decision_candidate.decision_status !==
    "ready_for_future_next_work_signal_write_authorization"
  ) {
    reasons.push("next_work_signal_decision_candidate_not_ready");
  }
  if (contract.proposed_decision_candidate.writes_now !== false) {
    reasons.push("next_work_signal_decision_candidate_writes_now_not_false");
  }
  if (
    contract.proposed_decision_inputs.selected_card_write_flags_all_false !== true
  ) {
    reasons.push("selected_next_work_candidate_card_write_flags_not_false");
  }
  return reasons;
}

function validateReview(
  review: ResearchCandidateManualGlobalDogfoodNextWorkSignalReview,
) {
  const reasons: string[] = [];
  if (review.review_status !== "ready_for_future_next_work_signal_write_slice") {
    reasons.push("next_work_signal_review_not_ready_for_future_write_slice");
  }
  if (review.validation.passed !== true) {
    reasons.push("next_work_signal_review_validation_not_passed");
  }
  if (review.validation.no_write_authority !== true) {
    reasons.push("next_work_signal_review_no_write_authority_not_preserved");
  }
  if (
    review.operator_decision !==
    "accept_contract_for_future_next_work_signal_write_slice"
  ) {
    reasons.push("next_work_signal_review_operator_decision_not_accept");
  }
  if (review.validation.operator_note_persisted !== false) {
    reasons.push("next_work_signal_review_operator_note_persisted");
  }
  if (!contractAuthorityBoundaryStillReadOnly({ authority_boundary: review.authority_boundary })) {
    reasons.push("next_work_signal_review_authority_boundary_not_preview_only");
  }
  return reasons;
}

function validateOperatorAuthorization(operatorAuthorization: JsonRecord) {
  const reasons: string[] = [];
  if (
    operatorAuthorization.authorization_kind !==
    "manual_operator_authorized_next_work_signal_decision_write"
  ) {
    reasons.push("operator_authorization_kind_invalid");
  }
  if (
    operatorAuthorization.operator_confirmation_text !==
    RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_SIGNAL_WRITE_CONFIRMATION
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
  contract: ResearchCandidateManualGlobalDogfoodNextWorkSignalContract;
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
    contract.proposed_next_work_signal_mapping.outcome_label
  ) {
    reasons.push("source_outcome_label_mismatch");
  }
  if (
    stableJson(sourceLedger.ledger_record.selected_candidate_context_refs) !==
    stableJson(contract.proposed_next_work_signal_mapping.selected_candidate_context_refs)
  ) {
    reasons.push("source_selected_candidate_context_refs_mismatch");
  }
  return reasons;
}

function validateSourceManualGlobalDogfoodMetricSnapshot({
  sourceMetric,
  request,
}: {
  sourceMetric: ReturnType<typeof readResearchCandidateManualGlobalDogfoodMetricSnapshotByReceiptId>;
  request: ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteRequest;
}) {
  const contract = request.next_work_signal_contract;
  const reasons: string[] = [];
  if (!sourceMetric) {
    reasons.push("source_metric_snapshot_receipt_not_found");
    return reasons;
  }
  if (sourceMetric.receipt.write_status !== "committed") {
    reasons.push("source_metric_snapshot_receipt_not_active_committed");
  }
  if (!sourceMetric.metric_snapshot_record) {
    reasons.push("source_metric_snapshot_record_missing");
    return reasons;
  }
  if (sourceMetric.receipt.receipt_id !== request.source_metric_snapshot_receipt_id) {
    reasons.push("source_metric_snapshot_receipt_id_mismatch");
  }
  if (
    sourceMetric.metric_snapshot_record.metric_snapshot_record_id !==
    request.source_metric_snapshot_record_id
  ) {
    reasons.push("source_metric_snapshot_record_id_mismatch");
  }
  if (
    sourceMetric.receipt.source_projection_fingerprint !==
    contract.source_projection_fingerprint
  ) {
    reasons.push("source_metric_snapshot_projection_fingerprint_mismatch");
  }
  if (
    sourceMetric.receipt.source_global_dogfood_ledger_receipt_id !==
    contract.source_latest_active_committed_receipt_id
  ) {
    reasons.push("source_metric_snapshot_ledger_receipt_id_mismatch");
  }
  if (
    sourceMetric.receipt.source_global_dogfood_ledger_record_id !==
    contract.source_ledger_record_ref
  ) {
    reasons.push("source_metric_snapshot_ledger_record_id_mismatch");
  }
  if (sourceMetric.receipt.source_manual_receipt_id !== contract.source_manual_receipt_id) {
    reasons.push("source_metric_snapshot_manual_receipt_id_mismatch");
  }
  if (
    sourceMetric.receipt.source_handoff_seed_fingerprint !==
    contract.source_handoff_seed_fingerprint
  ) {
    reasons.push("source_metric_snapshot_handoff_seed_fingerprint_mismatch");
  }
  if (
    sourceMetric.receipt.source_result_text_fingerprint !==
    contract.source_result_text_fingerprint
  ) {
    reasons.push("source_metric_snapshot_result_text_fingerprint_mismatch");
  }
  if (
    sourceMetric.receipt.source_expected_observed_delta_record_ref !==
    contract.source_expected_observed_delta_record_ref
  ) {
    reasons.push("source_metric_snapshot_expected_observed_ref_mismatch");
  }
  if (
    sourceMetric.receipt.source_reuse_outcome_record_ref !==
    contract.source_reuse_outcome_record_ref
  ) {
    reasons.push("source_metric_snapshot_reuse_outcome_ref_mismatch");
  }
  if (
    sourceMetric.metric_snapshot_record.outcome_label !==
    contract.proposed_next_work_signal_mapping.outcome_label
  ) {
    reasons.push("source_metric_snapshot_outcome_label_mismatch");
  }
  if (
    sourceMetric.metric_snapshot_record.outcome_signal !==
    contract.proposed_next_work_signal_mapping.outcome_signal
  ) {
    reasons.push("source_metric_snapshot_outcome_signal_mismatch");
  }
  if (
    stableJson(sourceMetric.metric_snapshot_record.selected_candidate_context_refs) !==
    stableJson(contract.proposed_next_work_signal_mapping.selected_candidate_context_refs)
  ) {
    reasons.push("source_metric_snapshot_selected_context_refs_mismatch");
  }
  return reasons;
}

function supersedePreviousReceipt({
  db,
  request,
}: {
  db: NextWorkSignalDbLike;
  request: ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteRequest;
}) {
  const supersedesReceiptId =
    request.operator_authorization.supersedes_receipt_id ?? "";
  const target =
    readResearchCandidateManualGlobalDogfoodNextWorkSignalByReceiptId(
      supersedesReceiptId,
      { scope: request.next_work_signal_contract.scope, db },
    );
  if (!target) return "supersedes_receipt_id_not_found";
  if (target.receipt.write_status !== "committed") {
    return "supersedes_receipt_not_committed";
  }
  const update = db
    .prepare(
      `
        UPDATE research_candidate_manual_global_dogfood_next_work_signal_receipts
        SET write_status = 'superseded'
        WHERE receipt_id = ?
          AND scope = ?
          AND write_status = 'committed'
      `,
    )
    .run(supersedesReceiptId, request.next_work_signal_contract.scope);
  return getRunChangeCount(update) === 1
    ? null
    : "supersedes_receipt_not_committed";
}

function validateSupersedeTargetForRequest({
  db,
  request,
  existingReceipt,
}: {
  db: NextWorkSignalDbLike;
  request: ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteRequest;
  existingReceipt: ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteReceipt | null;
}) {
  const supersedesReceiptId =
    request.operator_authorization.supersedes_receipt_id ?? "";
  const target =
    readResearchCandidateManualGlobalDogfoodNextWorkSignalByReceiptId(
      supersedesReceiptId,
      { scope: request.next_work_signal_contract.scope, db },
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
  request: ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteRequest;
  idempotencyKey: string;
  createdAt: string;
}): ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteReceipt {
  const contract = request.next_work_signal_contract;
  const source = {
    scope: contract.scope,
    source_next_work_contract_fingerprint:
      contract.validation.contract_fingerprint,
    source_next_work_review_fingerprint:
      request.next_work_signal_review.validation.review_fingerprint,
    source_projection_fingerprint: contract.source_projection_fingerprint,
    source_global_dogfood_ledger_receipt_id:
      contract.source_latest_active_committed_receipt_id!,
    source_global_dogfood_ledger_record_id: contract.source_ledger_record_ref!,
    source_metric_snapshot_receipt_id: request.source_metric_snapshot_receipt_id!,
    source_metric_snapshot_record_id: request.source_metric_snapshot_record_id!,
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
  const receiptId = `manual-global-dogfood-next-work-signal-receipt:${fingerprint({
    ...source,
    created_at: createdAt,
  })}`;
  return {
    receipt_id: receiptId,
    created_at: createdAt,
    scope: source.scope,
    source_next_work_contract_fingerprint:
      source.source_next_work_contract_fingerprint,
    source_next_work_review_fingerprint:
      source.source_next_work_review_fingerprint,
    source_projection_fingerprint: source.source_projection_fingerprint,
    source_global_dogfood_ledger_receipt_id:
      source.source_global_dogfood_ledger_receipt_id,
    source_global_dogfood_ledger_record_id:
      source.source_global_dogfood_ledger_record_id,
    source_metric_snapshot_receipt_id:
      source.source_metric_snapshot_receipt_id,
    source_metric_snapshot_record_id: source.source_metric_snapshot_record_id,
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

function buildNextWorkSignalRecord({
  request,
  receipt,
  createdAt,
  manualOnlyContextRefs,
}: {
  request: ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteRequest;
  receipt: ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteReceipt;
  createdAt: string;
  manualOnlyContextRefs: string[];
}): ResearchCandidateManualGlobalDogfoodNextWorkSignalRecord {
  const contract = request.next_work_signal_contract;
  const mapping = contract.proposed_next_work_signal_mapping;
  const sourceRefs = uniqueStrings([
    contract.source_projection_ref,
    contract.source_projection_fingerprint,
    contract.source_latest_active_committed_receipt_id,
    contract.source_ledger_record_ref,
    request.source_metric_snapshot_receipt_id,
    request.source_metric_snapshot_record_id,
    contract.source_manual_receipt_id,
    contract.source_contract_fingerprint,
    contract.source_authorization_review_fingerprint,
    contract.source_handoff_seed_fingerprint,
    contract.source_result_text_fingerprint,
    contract.source_expected_observed_delta_record_ref,
    contract.source_reuse_outcome_record_ref,
    contract.validation.contract_fingerprint,
    request.next_work_signal_review.validation.review_fingerprint,
    ...contract.source_next_work_candidate_card_ids,
    ...mapping.selected_candidate_context_refs,
  ]);
  const source = {
    receipt_id: receipt.receipt_id,
    scope: contract.scope,
    source_global_dogfood_ledger_receipt_id:
      contract.source_latest_active_committed_receipt_id!,
    source_global_dogfood_ledger_record_id: contract.source_ledger_record_ref!,
    source_metric_snapshot_receipt_id: request.source_metric_snapshot_receipt_id!,
    source_metric_snapshot_record_id: request.source_metric_snapshot_record_id!,
    source_projection_fingerprint: contract.source_projection_fingerprint,
    source_next_work_contract_fingerprint:
      contract.validation.contract_fingerprint,
    source_next_work_review_fingerprint:
      request.next_work_signal_review.validation.review_fingerprint,
    recommended_next_work_label: mapping.recommended_next_work_label!,
    rationale: mapping.rationale!,
    outcome_label: mapping.outcome_label!,
    outcome_signal: mapping.outcome_signal!,
    candidate_priority_hint:
      contract.proposed_decision_candidate.candidate_priority_hint,
    decision_status: contract.proposed_decision_candidate.decision_status,
    mismatch_or_gap_summary: mapping.mismatch_or_gap_summary,
    expected_summary: mapping.expected_summary,
    observed_summary: mapping.observed_summary,
    source_line: mapping.source_line,
    selected_candidate_context_refs: mapping.selected_candidate_context_refs,
    source_next_work_candidate_card_ids:
      contract.source_next_work_candidate_card_ids,
    blockers: mapping.blockers,
    warnings: mapping.warnings,
    manual_only_context_refs: manualOnlyContextRefs,
    source_refs: sourceRefs,
  };
  const recordId = `manual-global-dogfood-next-work-signal-record:${fingerprint({
    ...source,
    created_at: createdAt,
  })}`;
  return {
    next_work_signal_record_id: recordId,
    receipt_id: source.receipt_id,
    created_at: createdAt,
    scope: source.scope,
    source_global_dogfood_ledger_receipt_id:
      source.source_global_dogfood_ledger_receipt_id,
    source_global_dogfood_ledger_record_id:
      source.source_global_dogfood_ledger_record_id,
    source_metric_snapshot_receipt_id: source.source_metric_snapshot_receipt_id,
    source_metric_snapshot_record_id: source.source_metric_snapshot_record_id,
    source_projection_fingerprint: source.source_projection_fingerprint,
    source_next_work_contract_fingerprint:
      source.source_next_work_contract_fingerprint,
    source_next_work_review_fingerprint:
      source.source_next_work_review_fingerprint,
    recommended_next_work_label: source.recommended_next_work_label,
    rationale: source.rationale,
    outcome_label: source.outcome_label,
    outcome_signal: source.outcome_signal as "positive" | "negative" | "ambiguous",
    candidate_priority_hint: source.candidate_priority_hint,
    decision_status: source.decision_status,
    mismatch_or_gap_summary: source.mismatch_or_gap_summary,
    expected_summary: source.expected_summary,
    observed_summary: source.observed_summary,
    source_line: source.source_line,
    selected_candidate_context_refs: source.selected_candidate_context_refs,
    source_next_work_candidate_card_ids:
      source.source_next_work_candidate_card_ids,
    blockers: source.blockers,
    warnings: source.warnings,
    manual_only_context_refs: source.manual_only_context_refs,
    source_refs: source.source_refs,
    authority_profile: AUTHORITY_PROFILE,
    next_work_signal_record_fingerprint: fingerprint({
      ...source,
      next_work_signal_record_id: recordId,
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
}): ResearchCandidateManualGlobalDogfoodNextWorkSignalRollbackRecord {
  const rollbackId = `manual-global-dogfood-next-work-signal-rollback:${fingerprint({
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
  db: NextWorkSignalDbLike,
  receipt: ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteReceipt,
) {
  db.prepare(
    `
      INSERT INTO research_candidate_manual_global_dogfood_next_work_signal_receipts (
        receipt_id,
        created_at,
        scope,
        source_next_work_contract_fingerprint,
        source_next_work_review_fingerprint,
        source_projection_fingerprint,
        source_global_dogfood_ledger_receipt_id,
        source_global_dogfood_ledger_record_id,
        source_metric_snapshot_receipt_id,
        source_metric_snapshot_record_id,
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
        @source_next_work_contract_fingerprint,
        @source_next_work_review_fingerprint,
        @source_projection_fingerprint,
        @source_global_dogfood_ledger_receipt_id,
        @source_global_dogfood_ledger_record_id,
        @source_metric_snapshot_receipt_id,
        @source_metric_snapshot_record_id,
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

function insertNextWorkSignalRecord(
  db: NextWorkSignalDbLike,
  record: ResearchCandidateManualGlobalDogfoodNextWorkSignalRecord,
) {
  db.prepare(
    `
      INSERT INTO research_candidate_manual_global_dogfood_next_work_signal_records (
        next_work_signal_record_id,
        receipt_id,
        created_at,
        scope,
        source_global_dogfood_ledger_receipt_id,
        source_global_dogfood_ledger_record_id,
        source_metric_snapshot_receipt_id,
        source_metric_snapshot_record_id,
        source_projection_fingerprint,
        source_next_work_contract_fingerprint,
        source_next_work_review_fingerprint,
        recommended_next_work_label,
        rationale,
        outcome_label,
        outcome_signal,
        candidate_priority_hint,
        decision_status,
        mismatch_or_gap_summary,
        expected_summary,
        observed_summary,
        source_line,
        selected_candidate_context_refs_json,
        source_next_work_candidate_card_ids_json,
        blockers_json,
        warnings_json,
        manual_only_context_refs_json,
        source_refs_json,
        authority_profile,
        next_work_signal_record_fingerprint
      )
      VALUES (
        @next_work_signal_record_id,
        @receipt_id,
        @created_at,
        @scope,
        @source_global_dogfood_ledger_receipt_id,
        @source_global_dogfood_ledger_record_id,
        @source_metric_snapshot_receipt_id,
        @source_metric_snapshot_record_id,
        @source_projection_fingerprint,
        @source_next_work_contract_fingerprint,
        @source_next_work_review_fingerprint,
        @recommended_next_work_label,
        @rationale,
        @outcome_label,
        @outcome_signal,
        @candidate_priority_hint,
        @decision_status,
        @mismatch_or_gap_summary,
        @expected_summary,
        @observed_summary,
        @source_line,
        @selected_candidate_context_refs_json,
        @source_next_work_candidate_card_ids_json,
        @blockers_json,
        @warnings_json,
        @manual_only_context_refs_json,
        @source_refs_json,
        @authority_profile,
        @next_work_signal_record_fingerprint
      )
    `,
  ).run({
    ...record,
    selected_candidate_context_refs_json: JSON.stringify(
      record.selected_candidate_context_refs,
    ),
    source_next_work_candidate_card_ids_json: JSON.stringify(
      record.source_next_work_candidate_card_ids,
    ),
    blockers_json: JSON.stringify(record.blockers),
    warnings_json: JSON.stringify(record.warnings),
    manual_only_context_refs_json: JSON.stringify(record.manual_only_context_refs),
    source_refs_json: JSON.stringify(record.source_refs),
  });
}

function insertRollback(
  db: NextWorkSignalDbLike,
  rollback: ResearchCandidateManualGlobalDogfoodNextWorkSignalRollbackRecord,
) {
  db.prepare(
    `
      INSERT INTO research_candidate_manual_global_dogfood_next_work_signal_rollbacks (
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
  validation: ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteValidation;
  readback: ReturnType<typeof readResearchCandidateManualGlobalDogfoodNextWorkSignal>;
}): ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteResult {
  const existing = readback.records_by_receipt[0];
  return {
    ok: true,
    result_status: "duplicate_replayed",
    validation,
    receipt: existing?.receipt ?? null,
    next_work_signal_record: existing?.next_work_signal_record ?? null,
    readback,
    refusal_reasons: [],
    duplicate_replayed: true,
    idempotency_key: validation.idempotency_key,
    authority_boundary:
      getResearchCandidateManualGlobalDogfoodNextWorkSignalWriteAuthorityBoundary(),
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

function refusedResult({
  validation,
  idempotencyKey,
}: {
  validation: ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteValidation;
  idempotencyKey: string | null;
}): ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteResult {
  return {
    ok: false,
    result_status: "refused",
    validation,
    receipt: null,
    next_work_signal_record: null,
    readback: null,
    refusal_reasons: validation.failure_codes,
    duplicate_replayed: false,
    idempotency_key: idempotencyKey,
    authority_boundary:
      getResearchCandidateManualGlobalDogfoodNextWorkSignalWriteAuthorityBoundary(),
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

function validationResult({
  failureCodes,
  idempotencyKey,
  request,
}: {
  failureCodes: string[];
  idempotencyKey: string | null;
  request: JsonRecord | null;
}): ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteValidation {
  const uniqueFailureCodes = uniqueStrings(failureCodes);
  return {
    passed: uniqueFailureCodes.length === 0,
    failure_codes: uniqueFailureCodes,
    idempotency_key: idempotencyKey,
    exact_operator_confirmation_present:
      isRecord(request?.operator_authorization) &&
      request?.operator_authorization.operator_confirmation_text ===
        RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_SIGNAL_WRITE_CONFIRMATION,
    ready_next_work_signal_contract_present:
      isRecord(request?.next_work_signal_contract) &&
      request?.next_work_signal_contract.operator_authorization_mode ===
        "ready_for_future_next_work_signal_write_authorization",
    accepted_next_work_signal_review_present:
      isRecord(request?.next_work_signal_review) &&
      request?.next_work_signal_review.review_status ===
        "ready_for_future_next_work_signal_write_slice",
    preview_contract_remained_non_writing:
      isRecord(request?.next_work_signal_contract) &&
      contractNonWriteConfirmationStillClean(
        request.next_work_signal_contract as unknown as ResearchCandidateManualGlobalDogfoodNextWorkSignalContract,
      ),
    preview_authority_boundary_was_read_only:
      isRecord(request?.next_work_signal_contract) &&
      contractAuthorityBoundaryStillReadOnly(
        request.next_work_signal_contract as unknown as Pick<
          ResearchCandidateManualGlobalDogfoodNextWorkSignalContract,
          "authority_boundary"
        >,
      ),
    writer_authority_boundary_is_narrow: writerAuthorityBoundaryIsNarrow(),
    raw_text_fields_absent: !containsRawTextField(request),
    operator_note_absent: !containsOperatorNoteField(request),
    source_refs_present:
      isRecord(request?.next_work_signal_contract) &&
      sourceRefsPresent(
        request.next_work_signal_contract as unknown as ResearchCandidateManualGlobalDogfoodNextWorkSignalContract,
      ),
    source_metric_snapshot_refs_present:
      hasText(request?.source_metric_snapshot_receipt_id) &&
      hasText(request?.source_metric_snapshot_record_id),
    source_global_dogfood_ledger_receipt_active_committed:
      !uniqueFailureCodes.includes(
        "source_global_dogfood_ledger_receipt_not_active_committed",
      ) &&
      !uniqueFailureCodes.includes(
        "source_global_dogfood_ledger_receipt_not_found",
      ),
    source_global_dogfood_ledger_record_matches_contract:
      !uniqueFailureCodes.some((code) =>
        code.startsWith("source_") && code.includes("ledger") && code.endsWith("_mismatch"),
      ),
    source_metric_snapshot_receipt_active_committed:
      !uniqueFailureCodes.includes(
        "source_metric_snapshot_receipt_not_active_committed",
      ) &&
      !uniqueFailureCodes.includes("source_metric_snapshot_receipt_not_found"),
    source_metric_snapshot_record_matches_contract:
      !uniqueFailureCodes.some((code) =>
        code.startsWith("source_metric_snapshot") && code.endsWith("_mismatch"),
      ),
    selected_next_work_candidate_card_ids_present:
      isRecord(request?.next_work_signal_contract) &&
      Array.isArray(
        request.next_work_signal_contract.source_next_work_candidate_card_ids,
      ) &&
      request.next_work_signal_contract.source_next_work_candidate_card_ids
        .length > 0,
    proposed_decision_candidate_ready:
      isRecord(request?.next_work_signal_contract) &&
      isRecord(request.next_work_signal_contract.proposed_decision_candidate) &&
      request.next_work_signal_contract.proposed_decision_candidate
        .decision_status ===
        "ready_for_future_next_work_signal_write_authorization",
    selected_candidate_write_flags_false:
      isRecord(request?.next_work_signal_contract) &&
      isRecord(request.next_work_signal_contract.proposed_decision_inputs) &&
      request.next_work_signal_contract.proposed_decision_inputs
        .selected_card_write_flags_all_false === true,
  };
}

function validateRollbackRequest(request: unknown) {
  const reasons: string[] = [];
  if (!isRecord(request)) return ["rollback_request_must_be_object"];
  if (!hasText(request.receipt_id)) reasons.push("receipt_id_missing");
  const authorization = isRecord(request.rollback_authorization)
    ? request.rollback_authorization
    : null;
  if (!authorization) {
    reasons.push("rollback_authorization_missing");
    return reasons;
  }
  if (
    authorization.authorization_kind !==
    "manual_operator_authorized_next_work_signal_decision_rollback"
  ) {
    reasons.push("rollback_authorization_kind_invalid");
  }
  if (
    authorization.operator_confirmation_text !==
    RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_SIGNAL_ROLLBACK_CONFIRMATION
  ) {
    reasons.push("rollback_confirmation_text_invalid");
  }
  if (!hasText(authorization.rollback_reason)) {
    reasons.push("rollback_reason_missing");
  }
  if (containsRawTextField(request)) {
    reasons.push("raw_text_or_operator_note_field_refused");
  }
  return uniqueStrings(reasons);
}

function computeNextWorkSignalIdempotencyKey({
  contract,
  review,
  sourceMetricReceiptId,
  sourceMetricRecordId,
}: {
  contract: ResearchCandidateManualGlobalDogfoodNextWorkSignalContract;
  review: ResearchCandidateManualGlobalDogfoodNextWorkSignalReview;
  sourceMetricReceiptId: string;
  sourceMetricRecordId: string;
}) {
  return `manual-global-dogfood-next-work-signal:${fingerprint({
    write_version:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_SIGNAL_WRITE_VERSION,
    next_work_contract_fingerprint: contract.validation.contract_fingerprint,
    next_work_review_fingerprint: review.validation.review_fingerprint,
    source_projection_fingerprint: contract.source_projection_fingerprint,
    source_global_dogfood_ledger_receipt_id:
      contract.source_latest_active_committed_receipt_id,
    source_global_dogfood_ledger_record_id: contract.source_ledger_record_ref,
    source_metric_snapshot_receipt_id: sourceMetricReceiptId,
    source_metric_snapshot_record_id: sourceMetricRecordId,
    source_manual_receipt_id: contract.source_manual_receipt_id,
    source_handoff_seed_fingerprint: contract.source_handoff_seed_fingerprint,
    source_result_text_fingerprint: contract.source_result_text_fingerprint,
    source_expected_observed_delta_record_ref:
      contract.source_expected_observed_delta_record_ref,
    source_reuse_outcome_record_ref: contract.source_reuse_outcome_record_ref,
    source_next_work_candidate_card_ids:
      contract.source_next_work_candidate_card_ids,
    recommended_next_work_label:
      contract.proposed_next_work_signal_mapping.recommended_next_work_label,
    outcome_label: contract.proposed_next_work_signal_mapping.outcome_label,
    outcome_signal: contract.proposed_next_work_signal_mapping.outcome_signal,
    selected_candidate_context_refs:
      contract.proposed_next_work_signal_mapping.selected_candidate_context_refs,
  })}`;
}

function validationWithFailures(
  validation: ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteValidation,
  failures: string[],
): ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteValidation {
  return validationResult({
    failureCodes: [...validation.failure_codes, ...failures],
    idempotencyKey: validation.idempotency_key,
    request: null,
  });
}

function contractNonWriteConfirmationStillClean(
  contract: Pick<
    ResearchCandidateManualGlobalDogfoodNextWorkSignalContract,
    "non_write_confirmation"
  >,
) {
  return Object.values(contract.non_write_confirmation).every(
    (value) => value === false,
  );
}

function contractAuthorityBoundaryStillReadOnly(
  contract: Pick<
    ResearchCandidateManualGlobalDogfoodNextWorkSignalContract,
    "authority_boundary"
  >,
) {
  const boundary = contract.authority_boundary;
  return (
    boundary.preview_only === true &&
    boundary.read_only === true &&
    boundary.can_write_next_work_bias === false &&
    boundary.can_write_work_item === false &&
    boundary.can_mutate_work === false &&
    boundary.can_write_perspective_state === false &&
    boundary.can_promote_perspective === false &&
    boundary.can_write_perspective_memory === false &&
    boundary.can_write_dogfood_metrics === false &&
    boundary.can_write_global_dogfood_ledger === false &&
    boundary.can_write_proof_or_evidence === false &&
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
    getResearchCandidateManualGlobalDogfoodNextWorkSignalWriteAuthorityBoundary();
  return (
    boundary.can_write_next_work_signal_decision_record === true &&
    boundary.can_write_next_work_signal_decision_receipt === true &&
    boundary.can_write_next_work_signal_rollback_metadata === true &&
    boundary.can_write_next_work_bias === false &&
    boundary.can_write_work_item === false &&
    boundary.can_mutate_work === false &&
    boundary.can_write_perspective_state === false &&
    boundary.can_write_perspective_memory === false &&
    boundary.can_write_dogfood_metrics === false &&
    boundary.can_write_global_dogfood_ledger === false &&
    boundary.can_write_metric_snapshot === false &&
    boundary.can_mutate_metric_snapshot === false &&
    boundary.can_write_proof_or_evidence === false &&
    boundary.can_execute_product_write === false
  );
}

function sourceRefsPresent(
  contract: ResearchCandidateManualGlobalDogfoodNextWorkSignalContract,
) {
  return [
    contract.source_projection_fingerprint,
    contract.source_latest_active_committed_receipt_id,
    contract.source_ledger_record_ref,
    contract.source_manual_receipt_id,
    contract.source_handoff_seed_fingerprint,
    contract.source_result_text_fingerprint,
    contract.source_expected_observed_delta_record_ref,
    contract.source_reuse_outcome_record_ref,
  ].every(hasText);
}

function validateRequestedSideEffects(value: unknown) {
  if (value === undefined) return [];
  if (!isRecord(value)) return ["requested_side_effects_must_be_object"];
  return Object.entries(value)
    .filter(([key, sideEffect]) =>
      sideEffect === true
        ? FORBIDDEN_SIDE_EFFECT_KEYS.some((pattern) => pattern.test(key))
        : false,
    )
    .map(([key]) => `requested_side_effect_forbidden:${key}`);
}

function containsRawTextField(value: unknown): boolean {
  if (!isRecord(value) && !Array.isArray(value)) return false;
  if (Array.isArray(value)) return value.some(containsRawTextField);
  return Object.entries(value).some(([key, nested]) => {
    if (RAW_TEXT_KEYS.has(key)) return true;
    return containsRawTextField(nested);
  });
}

function containsOperatorNoteField(value: unknown): boolean {
  if (!isRecord(value) && !Array.isArray(value)) return false;
  if (Array.isArray(value)) return value.some(containsOperatorNoteField);
  return Object.entries(value).some(([key, nested]) => {
    if (
      key === "operator_note" ||
      key === "operator_notes" ||
      key === "raw_operator_notes"
    ) {
      return true;
    }
    return containsOperatorNoteField(nested);
  });
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return [...new Set(values.filter(hasText))];
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

function fingerprint(value: unknown) {
  return `${FINGERPRINT_ALGORITHM}:${fnv1a32(stableJson(value))}`;
}

function fnv1a32(value: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function rollbackWriteTransaction(db: NextWorkSignalDbLike) {
  try {
    db.prepare("ROLLBACK").run();
  } catch {
    // Best-effort rollback; refusal handling reports the failed write.
  }
}

function getRunChangeCount(result: unknown) {
  return isRecord(result) && typeof result.changes === "number"
    ? result.changes
    : null;
}
