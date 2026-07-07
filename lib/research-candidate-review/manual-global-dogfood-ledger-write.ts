import { openDatabase } from "@/lib/db";
import {
  ensureResearchCandidateManualGlobalDogfoodLedgerSchema,
  getResearchCandidateManualGlobalDogfoodLedgerWriteAuthorityBoundary,
  readResearchCandidateManualGlobalDogfoodLedger,
  readResearchCandidateManualGlobalDogfoodLedgerByReceiptId,
  type ResearchCandidateManualGlobalDogfoodLedgerDbLike,
} from "@/lib/research-candidate-review/read-manual-global-dogfood-ledger";
import {
  readResearchCandidateManualResultRecordsByReceiptId,
  type ResearchCandidateManualResultRecordDbLike,
} from "@/lib/research-candidate-review/read-manual-result-records";
import type {
  ResearchCandidateManualResultDogfoodLedgerAuthorizationContract,
} from "@/types/research-candidate-manual-result-dogfood-ledger-authorization-contract";
import type {
  ResearchCandidateManualResultDogfoodLedgerAuthorizationReview,
} from "@/types/research-candidate-manual-result-dogfood-ledger-authorization-review";
import {
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_LEDGER_ROLLBACK_CONFIRMATION,
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_LEDGER_WRITE_CONFIRMATION,
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_LEDGER_WRITE_KIND,
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_LEDGER_WRITE_VERSION,
  type ResearchCandidateManualGlobalDogfoodLedgerRecord,
  type ResearchCandidateManualGlobalDogfoodLedgerRollbackRecord,
  type ResearchCandidateManualGlobalDogfoodLedgerRollbackRequest,
  type ResearchCandidateManualGlobalDogfoodLedgerRollbackResult,
  type ResearchCandidateManualGlobalDogfoodLedgerWriteReceipt,
  type ResearchCandidateManualGlobalDogfoodLedgerWriteRequest,
  type ResearchCandidateManualGlobalDogfoodLedgerWriteResult,
  type ResearchCandidateManualGlobalDogfoodLedgerWriteValidation,
} from "@/types/research-candidate-manual-global-dogfood-ledger-write";

type JsonRecord = Record<string, unknown>;

const AUTHORITY_PROFILE =
  "manual_research_candidate_global_dogfood_ledger_write.v0.1" as const;
const FINGERPRINT_ALGORITHM = "fnv1a32_canonical_json_v0_1" as const;
const SUPPORTED_OUTCOME_LABELS = new Set([
  "helpful",
  "stale",
  "missing",
  "noisy",
  "misleading",
]);
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

export function writeResearchCandidateManualGlobalDogfoodLedger(
  request: unknown,
  options: { db?: ResearchCandidateManualGlobalDogfoodLedgerDbLike } = {},
): ResearchCandidateManualGlobalDogfoodLedgerWriteResult {
  const validation = validateResearchCandidateManualGlobalDogfoodLedgerWriteRequest(
    request,
  );
  const boundary =
    getResearchCandidateManualGlobalDogfoodLedgerWriteAuthorityBoundary();
  if (!validation.passed || !isRecord(request)) {
    return refusedResult({
      validation,
      idempotencyKey: validation.idempotency_key,
    });
  }

  const typedRequest =
    request as unknown as ResearchCandidateManualGlobalDogfoodLedgerWriteRequest;
  const contract = typedRequest.authorization_contract;
  const mapping = contract.proposed_global_dogfood_mapping;
  const db = options.db ?? openDatabase();
  const ownsDb = !options.db;

  try {
    ensureResearchCandidateManualGlobalDogfoodLedgerSchema(db);
    const sourceReceipt = readResearchCandidateManualResultRecordsByReceiptId(
      mapping.source_manual_receipt_id!,
      {
        scope: contract.scope,
        db: db as unknown as ResearchCandidateManualResultRecordDbLike,
      },
    );
    const sourceRefFailures = validateSourceManualReceipt({
      sourceReceipt,
      contract,
    });
    if (sourceRefFailures.length > 0) {
      return refusedResult({
        validation: validationWithFailures(validation, sourceRefFailures),
        idempotencyKey: validation.idempotency_key,
      });
    }

    const createdAt = new Date().toISOString();
    const receipt = buildReceipt({
      request: typedRequest,
      idempotencyKey: validation.idempotency_key!,
      createdAt,
    });
    const ledgerRecord = buildLedgerRecord({
      request: typedRequest,
      receipt,
      createdAt,
    });

    let transactionStarted = false;
    try {
      db.prepare("BEGIN IMMEDIATE").run();
      transactionStarted = true;

      const existingReadback = readResearchCandidateManualGlobalDogfoodLedger({
        scope: contract.scope,
        idempotencyKey: validation.idempotency_key,
        limit: 1,
        db,
      });
      const existing = existingReadback.records_by_receipt[0];
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
      insertLedgerRecord(db, ledgerRecord);
      db.prepare("COMMIT").run();
      transactionStarted = false;
    } catch {
      if (transactionStarted) {
        rollbackWriteTransaction(db);
      }
      const duplicateReadback = readResearchCandidateManualGlobalDogfoodLedger({
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
      ledger_record: ledgerRecord,
      readback: readResearchCandidateManualGlobalDogfoodLedger({
        scope: contract.scope,
        receiptId: receipt.receipt_id,
        limit: 1,
        db,
      }),
      refusal_reasons: [],
      duplicate_replayed: false,
      idempotency_key: validation.idempotency_key,
      authority_boundary: boundary,
      dogfood_metrics_written: false,
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

export function rollbackResearchCandidateManualGlobalDogfoodLedgerReceipt(
  request: unknown,
  options: { db?: ResearchCandidateManualGlobalDogfoodLedgerDbLike } = {},
): ResearchCandidateManualGlobalDogfoodLedgerRollbackResult {
  const boundary =
    getResearchCandidateManualGlobalDogfoodLedgerWriteAuthorityBoundary();
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
    request as unknown as ResearchCandidateManualGlobalDogfoodLedgerRollbackRequest;
  const db = options.db ?? openDatabase();
  const ownsDb = !options.db;

  try {
    ensureResearchCandidateManualGlobalDogfoodLedgerSchema(db);
    const existing = readResearchCandidateManualGlobalDogfoodLedgerByReceiptId(
      typedRequest.receipt_id,
      { db },
    );
    if (!existing) {
      return rollbackResult({
        ok: false,
        status: "not_found",
        rollback: null,
        receipt: null,
        readback: readResearchCandidateManualGlobalDogfoodLedger({ db }),
        refusalReasons: ["receipt_not_found"],
      });
    }
    if (existing.receipt.ledger_write_status === "rolled_back" && existing.rollback) {
      return rollbackResult({
        ok: true,
        status: "rolled_back",
        rollback: existing.rollback,
        receipt: existing.receipt,
        readback: readResearchCandidateManualGlobalDogfoodLedger({
          receiptId: existing.receipt.receipt_id,
          db,
        }),
        refusalReasons: [],
      });
    }
    if (existing.receipt.ledger_write_status !== "committed") {
      return rollbackResult({
        ok: false,
        status: "refused",
        rollback: null,
        receipt: existing.receipt,
        readback: readResearchCandidateManualGlobalDogfoodLedger({
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
            UPDATE research_candidate_manual_global_dogfood_ledger_receipts
            SET ledger_write_status = 'rolled_back',
                rollback_of_receipt_id = receipt_id,
                rollback_reason = ?
            WHERE receipt_id = ?
              AND ledger_write_status = 'committed'
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
          readback: readResearchCandidateManualGlobalDogfoodLedger({
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
      const replay = readResearchCandidateManualGlobalDogfoodLedgerByReceiptId(
        typedRequest.receipt_id,
        { db },
      );
      if (replay?.rollback) {
        return rollbackResult({
          ok: true,
          status: "rolled_back",
          rollback: replay.rollback,
          receipt: replay.receipt,
          readback: readResearchCandidateManualGlobalDogfoodLedger({
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
        readback: readResearchCandidateManualGlobalDogfoodLedger({
          receiptId: existing.receipt.receipt_id,
          db,
        }),
        refusalReasons: ["rollback_transaction_failed"],
      });
    }

    const readback = readResearchCandidateManualGlobalDogfoodLedger({
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
    status: ResearchCandidateManualGlobalDogfoodLedgerRollbackResult["result_status"];
    rollback: ResearchCandidateManualGlobalDogfoodLedgerRollbackRecord | null;
    receipt: ResearchCandidateManualGlobalDogfoodLedgerWriteReceipt | null;
    readback: ResearchCandidateManualGlobalDogfoodLedgerRollbackResult["readback"];
    refusalReasons: string[];
  }): ResearchCandidateManualGlobalDogfoodLedgerRollbackResult {
    return {
      ok,
      result_status: status,
      rollback,
      receipt,
      readback,
      refusal_reasons: refusalReasons,
      authority_boundary: boundary,
      dogfood_metrics_written: false,
      proof_or_evidence_rows_written: false,
      work_or_perspective_rows_written: false,
      perspective_memory_written: false,
      product_write_executed: false,
    };
  }
}

export function validateResearchCandidateManualGlobalDogfoodLedgerWriteRequest(
  request: unknown,
): ResearchCandidateManualGlobalDogfoodLedgerWriteValidation {
  const reasons: string[] = [];
  if (!isRecord(request)) {
    return validationResult({
      failureCodes: ["request_must_be_object"],
      idempotencyKey: null,
      request: null,
    });
  }

  const contract = isRecord(request.authorization_contract)
    ? (request.authorization_contract as unknown as ResearchCandidateManualResultDogfoodLedgerAuthorizationContract)
    : null;
  const review = isRecord(request.authorization_review)
    ? (request.authorization_review as unknown as ResearchCandidateManualResultDogfoodLedgerAuthorizationReview)
    : null;
  const operatorAuthorization = isRecord(request.operator_authorization)
    ? request.operator_authorization
    : null;

  if (!contract) reasons.push("authorization_contract_missing");
  if (!review) reasons.push("authorization_review_missing");
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

  const idempotencyKey =
    contract && review ? computeLedgerIdempotencyKey(contract, review) : null;
  return validationResult({
    failureCodes: uniqueStrings(reasons),
    idempotencyKey,
    request,
  });
}

function validateContract(
  contract: ResearchCandidateManualResultDogfoodLedgerAuthorizationContract,
) {
  const reasons: string[] = [];
  const mapping = contract.proposed_global_dogfood_mapping;
  if (
    contract.operator_authorization_mode !==
    "ready_for_future_ledger_write_authorization"
  ) {
    reasons.push("authorization_contract_not_ready");
  }
  if (contract.validation.passed !== true) {
    reasons.push("authorization_contract_validation_not_passed");
  }
  if (contract.blocker_reasons.length > 0) {
    reasons.push("authorization_contract_blockers_present");
  }
  if (!previewNonWriteConfirmationStillClean(contract)) {
    reasons.push("authorization_contract_non_write_confirmation_invalid");
  }
  if (!previewAuthorityBoundaryStillReadOnly(contract)) {
    reasons.push("authorization_contract_authority_boundary_not_preview_only");
  }
  if (
    mapping.selected_context_outcome_label &&
    !SUPPORTED_OUTCOME_LABELS.has(mapping.selected_context_outcome_label)
  ) {
    reasons.push("unsupported_outcome_label");
  }
  if (!hasText(mapping.source_manual_receipt_id)) {
    reasons.push("source_manual_receipt_id_missing");
  }
  if (!hasText(mapping.source_handoff_seed_fingerprint)) {
    reasons.push("source_handoff_seed_fingerprint_missing");
  }
  if (!hasText(mapping.source_result_text_fingerprint)) {
    reasons.push("source_result_text_fingerprint_missing");
  }
  if (!hasText(mapping.source_expected_observed_delta_record_ref)) {
    reasons.push("source_expected_observed_delta_record_ref_missing");
  }
  if (!hasText(mapping.source_reuse_outcome_record_ref)) {
    reasons.push("source_reuse_outcome_record_ref_missing");
  }
  if (!hasText(mapping.expected_summary)) {
    reasons.push("expected_summary_missing");
  }
  if (!hasText(mapping.mismatch_or_gap_summary)) {
    reasons.push("mismatch_or_gap_summary_missing");
  }
  if (mapping.global_ledger_candidate_allowed !== true) {
    reasons.push("global_ledger_candidate_not_allowed");
  }
  if (mapping.global_metric_candidate_allowed !== false) {
    reasons.push("global_metric_candidate_unexpectedly_allowed");
  }
  return reasons;
}

function validateReview(
  review: ResearchCandidateManualResultDogfoodLedgerAuthorizationReview,
) {
  const reasons: string[] = [];
  if (review.review_status !== "ready_for_future_ledger_write_slice") {
    reasons.push("authorization_review_not_ready_for_future_write_slice");
  }
  if (review.validation.passed !== true) {
    reasons.push("authorization_review_validation_not_passed");
  }
  if (review.validation.no_write_authority !== true) {
    reasons.push("authorization_review_no_write_authority_not_preserved");
  }
  if (review.operator_decision !== "accept_contract_for_future_write_slice") {
    reasons.push("authorization_review_operator_decision_not_accept");
  }
  if (review.validation.operator_note_persisted !== false) {
    reasons.push("authorization_review_operator_note_persisted");
  }
  if (!previewReviewAuthorityBoundaryStillReadOnly(review)) {
    reasons.push("authorization_review_authority_boundary_not_preview_only");
  }
  return reasons;
}

function validateOperatorAuthorization(operatorAuthorization: JsonRecord) {
  const reasons: string[] = [];
  if (
    operatorAuthorization.authorization_kind !==
    "manual_operator_authorized_global_dogfood_ledger_write"
  ) {
    reasons.push("operator_authorization_kind_invalid");
  }
  if (
    operatorAuthorization.operator_confirmation_text !==
    RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_LEDGER_WRITE_CONFIRMATION
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

function validateSourceManualReceipt({
  sourceReceipt,
  contract,
}: {
  sourceReceipt: ReturnType<typeof readResearchCandidateManualResultRecordsByReceiptId>;
  contract: ResearchCandidateManualResultDogfoodLedgerAuthorizationContract;
}) {
  const reasons: string[] = [];
  const mapping = contract.proposed_global_dogfood_mapping;
  if (!sourceReceipt) {
    reasons.push("source_manual_receipt_not_found");
    return reasons;
  }
  if (sourceReceipt.receipt.write_status !== "committed") {
    reasons.push("source_manual_receipt_not_active_committed");
  }
  if (
    sourceReceipt.expected_observed_delta_record?.record_id !==
    mapping.source_expected_observed_delta_record_ref
  ) {
    reasons.push("source_expected_observed_delta_record_ref_mismatch");
  }
  if (
    sourceReceipt.reuse_outcome_record?.record_id !==
    mapping.source_reuse_outcome_record_ref
  ) {
    reasons.push("source_reuse_outcome_record_ref_mismatch");
  }
  if (
    sourceReceipt.receipt.source_handoff_seed_fingerprint !==
    mapping.source_handoff_seed_fingerprint
  ) {
    reasons.push("source_handoff_seed_fingerprint_mismatch");
  }
  if (
    sourceReceipt.expected_observed_delta_record?.source_result_text_fingerprint !==
      mapping.source_result_text_fingerprint ||
    sourceReceipt.reuse_outcome_record?.source_result_text_fingerprint !==
      mapping.source_result_text_fingerprint
  ) {
    reasons.push("source_result_text_fingerprint_mismatch");
  }
  return reasons;
}

function supersedePreviousReceipt({
  db,
  request,
}: {
  db: ResearchCandidateManualGlobalDogfoodLedgerDbLike;
  request: ResearchCandidateManualGlobalDogfoodLedgerWriteRequest;
}) {
  const supersedesReceiptId =
    request.operator_authorization.supersedes_receipt_id ?? "";
  const target = readResearchCandidateManualGlobalDogfoodLedgerByReceiptId(
    supersedesReceiptId,
    { scope: request.authorization_contract.scope, db },
  );
  if (!target) return "supersedes_receipt_id_not_found";
  if (target.receipt.ledger_write_status !== "committed") {
    return "supersedes_receipt_not_committed";
  }
  const update = db
    .prepare(
      `
        UPDATE research_candidate_manual_global_dogfood_ledger_receipts
        SET ledger_write_status = 'superseded'
        WHERE receipt_id = ?
          AND scope = ?
          AND ledger_write_status = 'committed'
      `,
    )
    .run(supersedesReceiptId, request.authorization_contract.scope);
  return getRunChangeCount(update) === 1
    ? null
    : "supersedes_receipt_not_committed";
}

function buildReceipt({
  request,
  idempotencyKey,
  createdAt,
}: {
  request: ResearchCandidateManualGlobalDogfoodLedgerWriteRequest;
  idempotencyKey: string;
  createdAt: string;
}): ResearchCandidateManualGlobalDogfoodLedgerWriteReceipt {
  const contract = request.authorization_contract;
  const mapping = contract.proposed_global_dogfood_mapping;
  const source = {
    scope: contract.scope,
    source_contract_fingerprint: contract.validation.contract_fingerprint,
    source_contract_ref: contract.source_bridge_preview_ref,
    source_authorization_review_fingerprint:
      request.authorization_review.validation.review_fingerprint,
    source_manual_receipt_id: mapping.source_manual_receipt_id!,
    source_bridge_preview_fingerprint: contract.source_bridge_preview_fingerprint,
    source_handoff_seed_fingerprint: mapping.source_handoff_seed_fingerprint!,
    source_result_text_fingerprint: mapping.source_result_text_fingerprint!,
    source_expected_observed_delta_record_ref:
      mapping.source_expected_observed_delta_record_ref!,
    source_reuse_outcome_record_ref: mapping.source_reuse_outcome_record_ref!,
    idempotency_key: idempotencyKey,
    supersedes_receipt_id:
      request.operator_authorization.write_mode === "supersede_previous"
        ? request.operator_authorization.supersedes_receipt_id ?? null
        : null,
  };
  const receiptId = `manual-global-dogfood-ledger-receipt:${fingerprint({
    ...source,
    created_at: createdAt,
  })}`;
  return {
    receipt_id: receiptId,
    created_at: createdAt,
    scope: source.scope,
    source_contract_fingerprint: source.source_contract_fingerprint,
    source_contract_ref: source.source_contract_ref,
    source_authorization_review_fingerprint:
      source.source_authorization_review_fingerprint,
    source_manual_receipt_id: source.source_manual_receipt_id,
    source_bridge_preview_fingerprint: source.source_bridge_preview_fingerprint,
    source_handoff_seed_fingerprint: source.source_handoff_seed_fingerprint,
    source_result_text_fingerprint: source.source_result_text_fingerprint,
    source_expected_observed_delta_record_ref:
      source.source_expected_observed_delta_record_ref,
    source_reuse_outcome_record_ref: source.source_reuse_outcome_record_ref,
    idempotency_key: source.idempotency_key,
    ledger_write_status: "committed",
    authority_profile: AUTHORITY_PROFILE,
    receipt_fingerprint: fingerprint({ ...source, receipt_id: receiptId }),
    supersedes_receipt_id: source.supersedes_receipt_id,
    rollback_of_receipt_id: null,
    rollback_reason: null,
  };
}

function buildLedgerRecord({
  request,
  receipt,
  createdAt,
}: {
  request: ResearchCandidateManualGlobalDogfoodLedgerWriteRequest;
  receipt: ResearchCandidateManualGlobalDogfoodLedgerWriteReceipt;
  createdAt: string;
}): ResearchCandidateManualGlobalDogfoodLedgerRecord {
  const mapping = request.authorization_contract.proposed_global_dogfood_mapping;
  const source = {
    receipt_id: receipt.receipt_id,
    scope: request.authorization_contract.scope,
    source_manual_receipt_id: mapping.source_manual_receipt_id!,
    source_handoff_seed_fingerprint: mapping.source_handoff_seed_fingerprint!,
    source_result_text_fingerprint: mapping.source_result_text_fingerprint!,
    source_expected_observed_delta_record_ref:
      mapping.source_expected_observed_delta_record_ref!,
    source_reuse_outcome_record_ref: mapping.source_reuse_outcome_record_ref!,
    outcome_label: mapping.selected_context_outcome_label,
    selected_candidate_context_refs: mapping.selected_candidate_context_refs,
    expected_summary: mapping.expected_summary!,
    observed_summary: mapping.observed_summary,
    mismatch_or_gap_summary: mapping.mismatch_or_gap_summary!,
    source_line: mapping.source_line,
    manual_only_context_refs: mapping.manual_only_context_refs,
    warning_reasons: mapping.warning_reasons,
    compatibility_findings: request.authorization_contract.compatibility_findings,
  };
  const ledgerRecordId = `manual-global-dogfood-ledger-record:${fingerprint({
    ...source,
    created_at: createdAt,
  })}`;
  return {
    ledger_record_id: ledgerRecordId,
    receipt_id: source.receipt_id,
    created_at: createdAt,
    scope: source.scope,
    source_manual_receipt_id: source.source_manual_receipt_id,
    source_handoff_seed_fingerprint: source.source_handoff_seed_fingerprint,
    source_result_text_fingerprint: source.source_result_text_fingerprint,
    source_expected_observed_delta_record_ref:
      source.source_expected_observed_delta_record_ref,
    source_reuse_outcome_record_ref: source.source_reuse_outcome_record_ref,
    outcome_label: source.outcome_label,
    selected_candidate_context_refs: source.selected_candidate_context_refs,
    expected_summary: source.expected_summary,
    observed_summary: source.observed_summary,
    mismatch_or_gap_summary: source.mismatch_or_gap_summary,
    source_line: source.source_line,
    manual_only_context_refs: source.manual_only_context_refs,
    warning_reasons: source.warning_reasons,
    compatibility_findings: source.compatibility_findings,
    authority_profile: AUTHORITY_PROFILE,
    ledger_record_fingerprint: fingerprint({
      ...source,
      ledger_record_id: ledgerRecordId,
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
}): ResearchCandidateManualGlobalDogfoodLedgerRollbackRecord {
  const rollbackId = `manual-global-dogfood-ledger-rollback:${fingerprint({
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
  db: ResearchCandidateManualGlobalDogfoodLedgerDbLike,
  receipt: ResearchCandidateManualGlobalDogfoodLedgerWriteReceipt,
) {
  db.prepare(
    `
      INSERT INTO research_candidate_manual_global_dogfood_ledger_receipts (
        receipt_id,
        created_at,
        scope,
        source_contract_fingerprint,
        source_contract_ref,
        source_authorization_review_fingerprint,
        source_manual_receipt_id,
        source_bridge_preview_fingerprint,
        source_handoff_seed_fingerprint,
        source_result_text_fingerprint,
        source_expected_observed_delta_record_ref,
        source_reuse_outcome_record_ref,
        idempotency_key,
        ledger_write_status,
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
        @source_contract_fingerprint,
        @source_contract_ref,
        @source_authorization_review_fingerprint,
        @source_manual_receipt_id,
        @source_bridge_preview_fingerprint,
        @source_handoff_seed_fingerprint,
        @source_result_text_fingerprint,
        @source_expected_observed_delta_record_ref,
        @source_reuse_outcome_record_ref,
        @idempotency_key,
        @ledger_write_status,
        @authority_profile,
        @receipt_fingerprint,
        @supersedes_receipt_id,
        @rollback_of_receipt_id,
        @rollback_reason
      )
    `,
  ).run(receipt);
}

function insertLedgerRecord(
  db: ResearchCandidateManualGlobalDogfoodLedgerDbLike,
  record: ResearchCandidateManualGlobalDogfoodLedgerRecord,
) {
  db.prepare(
    `
      INSERT INTO research_candidate_manual_global_dogfood_ledger_records (
        ledger_record_id,
        receipt_id,
        created_at,
        scope,
        source_manual_receipt_id,
        source_handoff_seed_fingerprint,
        source_result_text_fingerprint,
        source_expected_observed_delta_record_ref,
        source_reuse_outcome_record_ref,
        outcome_label,
        selected_candidate_context_refs_json,
        expected_summary,
        observed_summary,
        mismatch_or_gap_summary,
        source_line,
        manual_only_context_refs_json,
        warning_reasons_json,
        compatibility_findings_json,
        authority_profile,
        ledger_record_fingerprint
      )
      VALUES (
        @ledger_record_id,
        @receipt_id,
        @created_at,
        @scope,
        @source_manual_receipt_id,
        @source_handoff_seed_fingerprint,
        @source_result_text_fingerprint,
        @source_expected_observed_delta_record_ref,
        @source_reuse_outcome_record_ref,
        @outcome_label,
        @selected_candidate_context_refs_json,
        @expected_summary,
        @observed_summary,
        @mismatch_or_gap_summary,
        @source_line,
        @manual_only_context_refs_json,
        @warning_reasons_json,
        @compatibility_findings_json,
        @authority_profile,
        @ledger_record_fingerprint
      )
    `,
  ).run({
    ...record,
    selected_candidate_context_refs_json: JSON.stringify(
      record.selected_candidate_context_refs,
    ),
    manual_only_context_refs_json: JSON.stringify(record.manual_only_context_refs),
    warning_reasons_json: JSON.stringify(record.warning_reasons),
    compatibility_findings_json: JSON.stringify(record.compatibility_findings),
  });
}

function insertRollback(
  db: ResearchCandidateManualGlobalDogfoodLedgerDbLike,
  rollback: ResearchCandidateManualGlobalDogfoodLedgerRollbackRecord,
) {
  db.prepare(
    `
      INSERT INTO research_candidate_manual_global_dogfood_ledger_rollbacks (
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
  validation: ResearchCandidateManualGlobalDogfoodLedgerWriteValidation;
  readback: ReturnType<typeof readResearchCandidateManualGlobalDogfoodLedger>;
}): ResearchCandidateManualGlobalDogfoodLedgerWriteResult {
  const existing = readback.records_by_receipt[0];
  return {
    ok: true,
    result_status: "duplicate_replayed",
    validation,
    receipt: existing?.receipt ?? null,
    ledger_record: existing?.ledger_record ?? null,
    readback,
    refusal_reasons: [],
    duplicate_replayed: true,
    idempotency_key: validation.idempotency_key,
    authority_boundary:
      getResearchCandidateManualGlobalDogfoodLedgerWriteAuthorityBoundary(),
    dogfood_metrics_written: false,
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
  validation: ResearchCandidateManualGlobalDogfoodLedgerWriteValidation;
  idempotencyKey: string | null;
}): ResearchCandidateManualGlobalDogfoodLedgerWriteResult {
  return {
    ok: false,
    result_status: "refused",
    validation,
    receipt: null,
    ledger_record: null,
    readback: null,
    refusal_reasons: validation.failure_codes,
    duplicate_replayed: false,
    idempotency_key: idempotencyKey,
    authority_boundary:
      getResearchCandidateManualGlobalDogfoodLedgerWriteAuthorityBoundary(),
    dogfood_metrics_written: false,
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
}): ResearchCandidateManualGlobalDogfoodLedgerWriteValidation {
  const contract = request?.authorization_contract as
    | ResearchCandidateManualResultDogfoodLedgerAuthorizationContract
    | undefined;
  const review = request?.authorization_review as
    | ResearchCandidateManualResultDogfoodLedgerAuthorizationReview
    | undefined;
  const mapping = contract?.proposed_global_dogfood_mapping;
  return {
    passed: failureCodes.length === 0,
    failure_codes: failureCodes,
    idempotency_key: idempotencyKey,
    exact_operator_confirmation_present:
      isRecord(request?.operator_authorization) &&
      request.operator_authorization.operator_confirmation_text ===
        RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_LEDGER_WRITE_CONFIRMATION,
    ready_authorization_contract_present:
      contract?.operator_authorization_mode ===
        "ready_for_future_ledger_write_authorization" &&
      contract.validation.passed === true &&
      contract.blocker_reasons.length === 0,
    accepted_authorization_review_present:
      review?.review_status === "ready_for_future_ledger_write_slice" &&
      review.validation.passed === true &&
      review.operator_decision === "accept_contract_for_future_write_slice",
    preview_contract_remained_non_writing: contract
      ? previewNonWriteConfirmationStillClean(contract)
      : false,
    preview_authority_boundary_was_read_only: contract
      ? previewAuthorityBoundaryStillReadOnly(contract)
      : false,
    writer_authority_boundary_is_narrow: writerAuthorityBoundaryIsNarrow(),
    raw_text_fields_absent: request ? !containsRawTextField(request) : false,
    operator_note_absent: request ? !containsOperatorNote(request) : false,
    source_refs_present:
      Boolean(mapping?.source_manual_receipt_id) &&
      Boolean(mapping?.source_handoff_seed_fingerprint) &&
      Boolean(mapping?.source_result_text_fingerprint) &&
      Boolean(mapping?.source_expected_observed_delta_record_ref) &&
      Boolean(mapping?.source_reuse_outcome_record_ref),
    supported_outcome_label: mapping
      ? SUPPORTED_OUTCOME_LABELS.has(mapping.selected_context_outcome_label)
      : false,
  };
}

function validationWithFailures(
  validation: ResearchCandidateManualGlobalDogfoodLedgerWriteValidation,
  failures: string[],
) {
  const failureCodes = uniqueStrings([...validation.failure_codes, ...failures]);
  return {
    ...validation,
    passed: false,
    failure_codes: failureCodes,
  };
}

function validateRollbackRequest(request: unknown) {
  const reasons: string[] = [];
  if (!isRecord(request)) return ["rollback_request_must_be_object"];
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
    "manual_operator_authorized_global_dogfood_ledger_rollback"
  ) {
    reasons.push("rollback_authorization_kind_invalid");
  }
  if (
    rollbackAuthorization.operator_confirmation_text !==
    RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_LEDGER_ROLLBACK_CONFIRMATION
  ) {
    reasons.push("rollback_operator_confirmation_text_invalid");
  }
  if (!hasText(rollbackAuthorization.rollback_reason)) {
    reasons.push("rollback_reason_missing");
  }
  if (containsRawTextField(request)) {
    reasons.push("raw_text_or_operator_note_field_refused");
  }
  return uniqueStrings(reasons);
}

function computeLedgerIdempotencyKey(
  contract: ResearchCandidateManualResultDogfoodLedgerAuthorizationContract,
  review: ResearchCandidateManualResultDogfoodLedgerAuthorizationReview,
) {
  const mapping = contract.proposed_global_dogfood_mapping;
  return `manual-global-dogfood-ledger:${fingerprint({
    contract_version: contract.contract_version,
    contract_fingerprint: contract.validation.contract_fingerprint,
    authorization_review_fingerprint: review.validation.review_fingerprint,
    source_manual_receipt_id: mapping.source_manual_receipt_id,
    source_handoff_seed_fingerprint: mapping.source_handoff_seed_fingerprint,
    source_result_text_fingerprint: mapping.source_result_text_fingerprint,
    source_expected_observed_delta_record_ref:
      mapping.source_expected_observed_delta_record_ref,
    source_reuse_outcome_record_ref: mapping.source_reuse_outcome_record_ref,
    selected_outcome_label: mapping.selected_context_outcome_label,
    selected_candidate_context_refs: mapping.selected_candidate_context_refs,
  })}`;
}

function previewNonWriteConfirmationStillClean(
  contract: ResearchCandidateManualResultDogfoodLedgerAuthorizationContract,
) {
  const confirmation = contract.non_write_confirmation;
  return (
    confirmation.global_dogfood_ledger_written === false &&
    confirmation.dogfood_metrics_written === false &&
    confirmation.expected_observed_delta_global_record_written === false &&
    confirmation.reuse_outcome_global_record_written === false &&
    confirmation.proof_or_evidence_written === false &&
    confirmation.work_mutated === false &&
    confirmation.perspective_state_written === false &&
    confirmation.perspective_memory_written === false &&
    confirmation.product_write_executed === false &&
    confirmation.provider_openai_called === false &&
    confirmation.github_called === false &&
    confirmation.codex_executed === false &&
    confirmation.sources_fetched === false &&
    confirmation.retrieval_rag_embeddings_vector_fts_or_crawler_run === false
  );
}

function previewAuthorityBoundaryStillReadOnly(
  contract: ResearchCandidateManualResultDogfoodLedgerAuthorizationContract,
) {
  const boundary = contract.authority_boundary;
  return (
    boundary.preview_only === true &&
    boundary.read_only === true &&
    boundary.source_of_truth === false &&
    boundary.can_write_global_dogfood_ledger === false &&
    boundary.can_write_dogfood_metrics === false &&
    boundary.can_write_expected_observed_delta_global_record === false &&
    boundary.can_write_reuse_outcome_global_record === false &&
    boundary.can_write_manual_result_records === false &&
    boundary.can_mutate_manual_result_records === false &&
    boundary.can_write_proof_or_evidence === false &&
    boundary.can_mutate_work === false &&
    boundary.can_promote_perspective === false &&
    boundary.can_write_perspective_state === false &&
    boundary.can_write_perspective_memory === false &&
    boundary.can_execute_codex === false &&
    boundary.can_call_github === false &&
    boundary.can_call_providers_or_openai === false &&
    boundary.can_fetch_sources === false &&
    boundary.can_run_retrieval_rag_embeddings_vector_fts_or_crawler === false &&
    boundary.can_allocate_product_ids === false &&
    boundary.can_execute_product_write === false
  );
}

function previewReviewAuthorityBoundaryStillReadOnly(
  review: ResearchCandidateManualResultDogfoodLedgerAuthorizationReview,
) {
  return (
    review.validation.no_write_authority === true &&
    review.authority_boundary.can_write_global_dogfood_ledger === false &&
    review.authority_boundary.can_write_dogfood_metrics === false &&
    review.authority_boundary.can_write_manual_result_records === false
  );
}

function writerAuthorityBoundaryIsNarrow() {
  const boundary =
    getResearchCandidateManualGlobalDogfoodLedgerWriteAuthorityBoundary();
  return (
    boundary.can_write_manual_global_dogfood_ledger_receipt === true &&
    boundary.can_write_manual_global_dogfood_ledger_record === true &&
    boundary.can_write_manual_global_dogfood_rollback_metadata === true &&
    boundary.can_write_dogfood_metrics === false &&
    boundary.can_write_expected_observed_delta_global_record === false &&
    boundary.can_write_reuse_outcome_global_record === false &&
    boundary.can_write_proof_or_evidence === false &&
    boundary.can_mutate_work === false &&
    boundary.can_promote_perspective === false &&
    boundary.can_write_perspective_state === false &&
    boundary.can_write_perspective_memory === false &&
    boundary.can_mutate_manual_result_records === false &&
    boundary.can_execute_codex === false &&
    boundary.can_call_github === false &&
    boundary.can_call_providers_or_openai === false &&
    boundary.can_fetch_sources === false &&
    boundary.can_run_retrieval_rag_embeddings_vector_fts_or_crawler === false &&
    boundary.can_allocate_product_ids === false &&
    boundary.can_execute_product_write === false &&
    boundary.persists_raw_manual_note_text === false &&
    boundary.persists_raw_result_report_text === false &&
    boundary.persists_operator_notes === false
  );
}

function containsOperatorNote(value: unknown): boolean {
  if (!isRecord(value) && !Array.isArray(value)) return false;
  if (Array.isArray(value)) return value.some((item) => containsOperatorNote(item));
  return Object.keys(value).some(
    (key) =>
      key === "operator_note" ||
      key === "operator_notes" ||
      containsOperatorNote(value[key]),
  );
}

function containsRawTextField(value: unknown): boolean {
  if (!isRecord(value) && !Array.isArray(value)) return false;
  if (Array.isArray(value)) return value.some((item) => containsRawTextField(item));
  return Object.entries(value).some(
    ([key, nestedValue]) =>
      RAW_TEXT_KEYS.has(key) || containsRawTextField(nestedValue),
  );
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function getRunChangeCount(result: unknown) {
  if (
    result &&
    typeof result === "object" &&
    "changes" in result &&
    typeof (result as { changes?: unknown }).changes === "number"
  ) {
    return (result as { changes: number }).changes;
  }
  return null;
}

function rollbackWriteTransaction(
  db: ResearchCandidateManualGlobalDogfoodLedgerDbLike,
) {
  try {
    db.prepare("ROLLBACK").run();
  } catch {
    // The outer refusal or duplicate replay result covers rollback failure.
  }
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
