import { openDatabase } from "@/lib/db";
import {
  ensureResearchCandidateManualGlobalDogfoodNextWorkBiasSchema,
  readResearchCandidateManualGlobalDogfoodNextWorkBias,
  readResearchCandidateManualGlobalDogfoodNextWorkBiasByReceiptId,
} from "@/lib/research-candidate-review/read-manual-global-dogfood-next-work-bias";
import {
  ensureResearchCandidateManualGlobalDogfoodNextWorkSignalSchema,
  readResearchCandidateManualGlobalDogfoodNextWorkSignal,
  readResearchCandidateManualGlobalDogfoodNextWorkSignalByReceiptId,
} from "@/lib/research-candidate-review/read-manual-global-dogfood-next-work-signal";
import {
  ensureResearchCandidateManualGlobalDogfoodPerspectiveRelaySchema,
  getResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteAuthorityBoundary,
  readResearchCandidateManualGlobalDogfoodPerspectiveRelay,
  readResearchCandidateManualGlobalDogfoodPerspectiveRelayByReceiptId,
  type ResearchCandidateManualGlobalDogfoodPerspectiveRelayDbLike,
} from "@/lib/research-candidate-review/read-manual-global-dogfood-perspective-relay";
import type {
  ResearchCandidateManualGlobalDogfoodPerspectiveRelayContract,
} from "@/types/research-candidate-manual-global-dogfood-perspective-relay-contract";
import type {
  ResearchCandidateManualGlobalDogfoodPerspectiveRelayReview,
} from "@/types/research-candidate-manual-global-dogfood-perspective-relay-review";
import {
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_RELAY_ROLLBACK_CONFIRMATION,
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_RELAY_WRITE_CONFIRMATION,
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_RELAY_WRITE_VERSION,
  type ResearchCandidateManualGlobalDogfoodPerspectiveRelayRecord,
  type ResearchCandidateManualGlobalDogfoodPerspectiveRelayRollbackRecord,
  type ResearchCandidateManualGlobalDogfoodPerspectiveRelayRollbackResult,
  type ResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteReceipt,
  type ResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteRequest,
  type ResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteResult,
  type ResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteValidation,
} from "@/types/research-candidate-manual-global-dogfood-perspective-relay-write";
import type { ResearchCandidateManualGlobalDogfoodNextWorkBiasReadback } from "@/types/research-candidate-manual-global-dogfood-next-work-bias-write";
import type { ResearchCandidateManualGlobalDogfoodNextWorkSignalReadback } from "@/types/research-candidate-manual-global-dogfood-next-work-signal-write";

type RelayDbLike = ResearchCandidateManualGlobalDogfoodPerspectiveRelayDbLike;
type JsonRecord = Record<string, unknown>;

const FINGERPRINT_ALGORITHM = "fnv1a32_canonical_json_v0_1" as const;
const AUTHORITY_PROFILE =
  "manual_global_dogfood_perspective_relay_write_authority.v0.1";
const SUPPORTED_OUTCOME_SIGNALS = new Set(["positive", "negative", "ambiguous"]);
const RAW_TEXT_KEYS = new Set([
  "raw_manual_note_text",
  "manual_note_text",
  "raw_result_report_text",
  "result_report_text",
  "raw_report_text",
  "operator_note",
  "operator_notes",
  "raw_operator_notes",
]);
const FORBIDDEN_SIDE_EFFECT_KEYS = [
  /perspective.*(state|promotion|promote|memory)/i,
  /next.*work.*bias.*(write|mutate|update)/i,
  /work.*(write|mutate|status|item|event)/i,
  /proof|evidence/i,
  /dogfood.*metrics|global.*metric/i,
  /global.*dogfood.*ledger/i,
  /metric.*snapshot.*(write|mutate|update)/i,
  /next.*work.*signal.*(write|mutate|update)/i,
  /product|delivery/i,
  /provider|openai/i,
  /github/i,
  /codex/i,
  /retrieval|rag|embedding|vector|fts|crawler|source.*fetch/i,
] as const;

export function writeResearchCandidateManualGlobalDogfoodPerspectiveRelay(
  request: unknown,
  options: { db?: RelayDbLike } = {},
): ResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteResult {
  const validation =
    validateResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteRequest(
      request,
    );
  if (!validation.passed || !isRecord(request)) {
    return refusedResult({ validation, idempotencyKey: validation.idempotency_key });
  }

  const typedRequest =
    request as unknown as ResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteRequest;
  const contract = typedRequest.perspective_relay_contract;
  const db = options.db ?? (openDatabase() as unknown as RelayDbLike);
  const ownsDb = !options.db;

  try {
    ensureResearchCandidateManualGlobalDogfoodNextWorkSignalSchema(db);
    ensureResearchCandidateManualGlobalDogfoodNextWorkBiasSchema(db);
    ensureResearchCandidateManualGlobalDogfoodPerspectiveRelaySchema(db);

    const earlySourceFailures = validateSourcesForRequest({ db, request: typedRequest });
    if (earlySourceFailures.length > 0) {
      return refusedResult({
        validation: validationWithFailures(validation, earlySourceFailures),
        idempotencyKey: validation.idempotency_key,
      });
    }

    const createdAt = new Date().toISOString();
    const sourceBias = getSourceBiasForRequest({ db, request: typedRequest });
    const receipt = buildReceipt({
      request: typedRequest,
      sourceBias: sourceBias!,
      idempotencyKey: validation.idempotency_key!,
      createdAt,
    });
    const relayRecord = buildPerspectiveRelayRecord({
      request: typedRequest,
      sourceBias: sourceBias!,
      receipt,
      createdAt,
    });

    let transactionStarted = false;
    try {
      db.prepare("BEGIN IMMEDIATE").run();
      transactionStarted = true;

      const existingReadback =
        readResearchCandidateManualGlobalDogfoodPerspectiveRelay({
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
        const supersedeFailure = supersedePreviousReceipt({ db, request: typedRequest });
        if (supersedeFailure) {
          rollbackWriteTransaction(db);
          transactionStarted = false;
          return refusedResult({
            validation: validationWithFailures(validation, [supersedeFailure]),
            idempotencyKey: validation.idempotency_key,
          });
        }
      }

      const transactionalSourceFailures = validateSourcesForRequest({
        db,
        request: typedRequest,
        ignoreRequestSuppliedReadbacks: true,
      });
      if (transactionalSourceFailures.length > 0) {
        rollbackWriteTransaction(db);
        transactionStarted = false;
        return refusedResult({
          validation: validationWithFailures(validation, transactionalSourceFailures),
          idempotencyKey: validation.idempotency_key,
        });
      }

      insertReceipt(db, receipt);
      insertPerspectiveRelayRecord(db, relayRecord);
      db.prepare("COMMIT").run();
      transactionStarted = false;
    } catch {
      if (transactionStarted) rollbackWriteTransaction(db);
      const duplicateReadback =
        readResearchCandidateManualGlobalDogfoodPerspectiveRelay({
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
      perspective_relay_record: relayRecord,
      readback: readResearchCandidateManualGlobalDogfoodPerspectiveRelay({
        scope: contract.scope,
        receiptId: receipt.receipt_id,
        limit: 1,
        db,
      }),
      refusal_reasons: [],
      duplicate_replayed: false,
      idempotency_key: validation.idempotency_key,
      authority_boundary:
        getResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteAuthorityBoundary(),
      ...writeResultFlags(true),
    };
  } finally {
    if (ownsDb && "close" in db && typeof db.close === "function") {
      db.close();
    }
  }
}

export function rollbackResearchCandidateManualGlobalDogfoodPerspectiveRelayReceipt(
  request: unknown,
  options: { db?: RelayDbLike } = {},
): ResearchCandidateManualGlobalDogfoodPerspectiveRelayRollbackResult {
  const refusalReasons = validateRollbackRequest(request);
  const db = options.db ?? (openDatabase() as unknown as RelayDbLike);
  const ownsDb = !options.db;
  try {
    ensureResearchCandidateManualGlobalDogfoodPerspectiveRelaySchema(db);
    if (refusalReasons.length > 0 || !isRecord(request)) {
      return rollbackRefused(refusalReasons);
    }
    const receiptId = String(request.receipt_id);
    const authorization = request.rollback_authorization as JsonRecord;
    const rollbackReason = String(authorization.rollback_reason).trim();
    let transactionStarted = false;
    try {
      db.prepare("BEGIN IMMEDIATE").run();
      transactionStarted = true;
      const existing =
        readResearchCandidateManualGlobalDogfoodPerspectiveRelayByReceiptId(
          receiptId,
          { db },
        );
      if (!existing) {
        rollbackWriteTransaction(db);
        transactionStarted = false;
        return rollbackRefused(["receipt_not_found"]);
      }
      if (existing.receipt.write_status === "rolled_back") {
        rollbackWriteTransaction(db);
        transactionStarted = false;
        return {
          ok: true,
          result_status: "rolled_back",
          rollback: existing.rollback,
          receipt: existing.receipt,
          readback: readResearchCandidateManualGlobalDogfoodPerspectiveRelay({
            scope: existing.receipt.scope,
            receiptId,
            limit: 1,
            db,
          }),
          refusal_reasons: [],
          authority_boundary:
            getResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteAuthorityBoundary(),
          ...writeResultFlags(true),
        };
      }
      if (existing.receipt.write_status !== "committed") {
        rollbackWriteTransaction(db);
        transactionStarted = false;
        return rollbackRefused(["receipt_not_committed"]);
      }

      const rollback = buildRollbackRecord({
        receiptId,
        rollbackReason,
        createdAt: new Date().toISOString(),
      });
      const update = db
        .prepare(
          `
            UPDATE research_candidate_manual_global_dogfood_perspective_relay_receipts
            SET write_status = 'rolled_back',
                rollback_of_receipt_id = receipt_id,
                rollback_reason = ?
            WHERE receipt_id = ?
              AND write_status = 'committed'
          `,
        )
        .run(rollbackReason, receiptId);
      if (getRunChangeCount(update) !== 1) {
        rollbackWriteTransaction(db);
        transactionStarted = false;
        return rollbackRefused(["receipt_not_committed"]);
      }
      insertRollback(db, rollback);
      db.prepare("COMMIT").run();
      transactionStarted = false;
      const readback = readResearchCandidateManualGlobalDogfoodPerspectiveRelay({
        scope: existing.receipt.scope,
        receiptId,
        limit: 1,
        db,
      });
      return {
        ok: true,
        result_status: "rolled_back",
        rollback,
        receipt: readback.records_by_receipt[0]?.receipt ?? null,
        readback,
        refusal_reasons: [],
        authority_boundary:
          getResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteAuthorityBoundary(),
        ...writeResultFlags(true),
      };
    } catch {
      if (transactionStarted) rollbackWriteTransaction(db);
      return rollbackRefused(["sqlite_transaction_failed"]);
    }
  } finally {
    if (ownsDb && "close" in db && typeof db.close === "function") {
      db.close();
    }
  }
}

export function validateResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteRequest(
  request: unknown,
): ResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteValidation {
  const reasons: string[] = [];
  if (!isRecord(request)) {
    return validationResult({
      failureCodes: ["request_must_be_object"],
      idempotencyKey: null,
      request: null,
    });
  }

  const contractRecord = isRecord(request.perspective_relay_contract)
    ? request.perspective_relay_contract
    : null;
  const reviewRecord = isRecord(request.perspective_relay_review)
    ? request.perspective_relay_review
    : null;
  const operatorAuthorization = isRecord(request.operator_authorization)
    ? request.operator_authorization
    : null;
  if (!contractRecord) reasons.push("perspective_relay_contract_shape_invalid");
  if (!reviewRecord) reasons.push("perspective_relay_review_shape_invalid");
  if (!operatorAuthorization) {
    reasons.push("perspective_relay_operator_authorization_shape_invalid");
  }

  const contractShapeReasons = contractRecord
    ? validateContractShape(contractRecord)
    : [];
  const reviewShapeReasons = reviewRecord ? validateReviewShape(reviewRecord) : [];
  reasons.push(...contractShapeReasons, ...reviewShapeReasons);

  const contract =
    contractRecord && contractShapeReasons.length === 0
      ? (contractRecord as unknown as ResearchCandidateManualGlobalDogfoodPerspectiveRelayContract)
      : null;
  const review =
    reviewRecord && reviewShapeReasons.length === 0
      ? (reviewRecord as unknown as ResearchCandidateManualGlobalDogfoodPerspectiveRelayReview)
      : null;

  if (contract) reasons.push(...validateContract(contract));
  if (review) reasons.push(...validateReview(review));
  if (contract && review) {
    reasons.push(...validateReviewBoundToContract({ contract, review }));
  }
  if (operatorAuthorization) {
    reasons.push(...validateOperatorAuthorization(operatorAuthorization));
  }
  if (containsRawTextField(request)) {
    reasons.push("raw_text_or_operator_note_field_refused");
  }
  reasons.push(...validateRequestedSideEffects(request.requested_side_effects));

  const signalReadback = isRecord(request.source_next_work_signal_readback)
    ? (request.source_next_work_signal_readback as unknown as ResearchCandidateManualGlobalDogfoodNextWorkSignalReadback)
    : null;
  if (signalReadback && !sourceSignalReadbackFlagsAreClean(signalReadback)) {
    reasons.push("perspective_relay_source_readback_forbidden_mutation_flag");
  }
  const biasReadback = isRecord(request.source_next_work_bias_readback)
    ? (request.source_next_work_bias_readback as unknown as ResearchCandidateManualGlobalDogfoodNextWorkBiasReadback)
    : null;
  if (!biasReadback?.latest_active_committed) {
    reasons.push("perspective_relay_source_bias_receipt_not_active_committed");
  } else if (!sourceBiasReadbackFlagsAreClean(biasReadback)) {
    reasons.push("perspective_relay_source_readback_forbidden_mutation_flag");
  }

  const idempotencyKey =
    contract && biasReadback?.latest_active_committed
      ? computePerspectiveRelayIdempotencyKey({
          contract,
          sourceBias: biasReadback.latest_active_committed,
        })
      : null;
  return validationResult({
    failureCodes: uniqueStrings(reasons),
    idempotencyKey,
    request,
  });
}

function validateContractShape(contract: JsonRecord) {
  const reasons: string[] = [];
  const validation = isRecord(contract.validation) ? contract.validation : null;
  if (
    !validation ||
    typeof validation.passed !== "boolean" ||
    !hasText(validation.contract_fingerprint)
  ) {
    reasons.push("perspective_relay_contract_validation_shape_invalid");
  }
  if (!isRecord(contract.authority_boundary)) {
    reasons.push("perspective_relay_contract_shape_invalid");
  }
  if (!isRecord(contract.non_write_confirmation)) {
    reasons.push("perspective_relay_contract_shape_invalid");
  }
  if (!isRecord(contract.idempotency_contract_preview)) {
    reasons.push("perspective_relay_contract_shape_invalid");
  }
  const mapping = isRecord(contract.proposed_perspective_relay_mapping)
    ? contract.proposed_perspective_relay_mapping
    : null;
  if (!mapping) {
    reasons.push("perspective_relay_mapping_shape_invalid");
  } else {
    if (
      !hasText(mapping.relay_update_label) ||
      !hasText(mapping.relay_update_rationale) ||
      !hasText(mapping.recommended_next_work_label) ||
      mapping.can_feed_perspective_relay_update_candidate !== true ||
      mapping.can_write_perspective_relay_now !== false ||
      mapping.can_promote_perspective_now !== false ||
      mapping.can_write_perspective_memory_now !== false ||
      mapping.can_write_next_work_bias_now !== false ||
      mapping.can_mutate_work_now !== false
    ) {
      reasons.push("perspective_relay_mapping_shape_invalid");
    }
    for (const arrayField of [
      "selected_candidate_context_refs",
      "source_next_work_candidate_card_ids",
      "manual_only_context_refs",
      "blockers",
      "warnings",
    ]) {
      if (
        !Array.isArray(mapping[arrayField]) ||
        !mapping[arrayField].every(hasText)
      ) {
        reasons.push("perspective_relay_mapping_shape_invalid");
      }
    }
  }
  const candidate = isRecord(contract.proposed_relay_update_candidate)
    ? contract.proposed_relay_update_candidate
    : null;
  if (
    !candidate ||
    !hasText(candidate.candidate_status) ||
    !hasText(candidate.reason) ||
    candidate.writes_now !== false ||
    candidate.would_promote_perspective !== false ||
    candidate.would_write_memory !== false ||
    candidate.would_write_next_work_bias !== false
  ) {
    reasons.push("perspective_relay_mapping_shape_invalid");
  }
  for (const arrayField of ["blocker_reasons", "warning_reasons"]) {
    if (!Array.isArray(contract[arrayField])) {
      reasons.push("perspective_relay_contract_shape_invalid");
    }
  }
  return uniqueStrings(reasons);
}

function validateContract(
  contract: ResearchCandidateManualGlobalDogfoodPerspectiveRelayContract,
) {
  const reasons: string[] = [];
  const mapping = contract.proposed_perspective_relay_mapping;
  if (
    contract.operator_authorization_mode !==
    "ready_for_future_perspective_relay_write_authorization"
  ) {
    reasons.push("perspective_relay_contract_not_ready");
  }
  if (contract.validation.passed !== true) {
    reasons.push("perspective_relay_contract_validation_not_passed");
  }
  if (contract.blocker_reasons.length > 0) {
    reasons.push("perspective_relay_contract_blockers_present");
  }
  if (!contractNonWriteConfirmationStillClean(contract)) {
    reasons.push("perspective_relay_contract_non_write_confirmation_invalid");
  }
  if (!contractAuthorityBoundaryStillReadOnly(contract)) {
    reasons.push("perspective_relay_contract_authority_boundary_not_preview_only");
  }
  if (!sourceRefsPresent(contract)) {
    reasons.push("source_refs_missing");
  }
  if (!hasText(mapping.relay_update_label)) {
    reasons.push("relay_update_label_missing");
  }
  if (!hasText(mapping.relay_update_rationale)) {
    reasons.push("relay_update_rationale_missing");
  }
  if (mapping.selected_candidate_context_refs.length === 0) {
    reasons.push("selected_candidate_context_refs_missing");
  }
  if (mapping.source_next_work_candidate_card_ids.length === 0) {
    reasons.push("source_next_work_candidate_card_ids_missing");
  }
  if (
    !mapping.outcome_signal ||
    !SUPPORTED_OUTCOME_SIGNALS.has(mapping.outcome_signal)
  ) {
    reasons.push("unsupported_outcome_signal");
  }
  if (
    mapping.manual_only_context_refs.some((ref) =>
      /^(proof|evidence):/i.test(ref.trim()),
    )
  ) {
    reasons.push("manual_only_context_refs_treated_as_proof_or_evidence");
  }
  if (
    contract.proposed_relay_update_candidate.candidate_status !==
    "ready_for_future_perspective_relay_write_authorization"
  ) {
    reasons.push("perspective_relay_candidate_not_ready");
  }
  return reasons;
}

function validateReviewShape(review: JsonRecord) {
  const reasons: string[] = [];
  if (
    !hasText(review.source_contract_fingerprint) ||
    !hasText(review.review_status) ||
    !hasText(review.operator_decision)
  ) {
    reasons.push("perspective_relay_review_shape_invalid");
  }
  const validation = isRecord(review.validation) ? review.validation : null;
  if (
    !validation ||
    typeof validation.passed !== "boolean" ||
    typeof validation.no_write_authority !== "boolean" ||
    typeof validation.operator_note_persisted !== "boolean" ||
    !hasText(validation.review_fingerprint)
  ) {
    reasons.push("perspective_relay_review_validation_shape_invalid");
  }
  if (!isRecord(review.authority_boundary)) {
    reasons.push("perspective_relay_review_shape_invalid");
  }
  if (
    review.accepted_mapping_summary !== null &&
    review.accepted_mapping_summary !== undefined &&
    !isRecord(review.accepted_mapping_summary)
  ) {
    reasons.push("perspective_relay_review_shape_invalid");
  }
  return uniqueStrings(reasons);
}

function validateReview(
  review: ResearchCandidateManualGlobalDogfoodPerspectiveRelayReview,
) {
  const reasons: string[] = [];
  if (review.review_status !== "ready_for_future_perspective_relay_write_slice") {
    reasons.push("perspective_relay_review_not_ready_for_future_write_slice");
  }
  if (review.validation.passed !== true) {
    reasons.push("perspective_relay_review_validation_not_passed");
  }
  if (review.validation.no_write_authority !== true) {
    reasons.push("perspective_relay_review_no_write_authority_not_preserved");
  }
  if (
    review.operator_decision !==
    "accept_contract_for_future_perspective_relay_write_slice"
  ) {
    reasons.push("perspective_relay_review_operator_decision_not_accept");
  }
  if (review.validation.operator_note_persisted !== false) {
    reasons.push("perspective_relay_review_operator_note_persisted");
  }
  if (!contractAuthorityBoundaryStillReadOnly({ authority_boundary: review.authority_boundary })) {
    reasons.push("perspective_relay_review_authority_boundary_not_preview_only");
  }
  return reasons;
}

function validateReviewBoundToContract({
  contract,
  review,
}: {
  contract: ResearchCandidateManualGlobalDogfoodPerspectiveRelayContract;
  review: ResearchCandidateManualGlobalDogfoodPerspectiveRelayReview;
}) {
  const reasons: string[] = [];
  if (
    review.source_contract_fingerprint !==
    contract.validation.contract_fingerprint
  ) {
    reasons.push("perspective_relay_review_contract_mismatch");
  }
  const summary = review.accepted_mapping_summary;
  if (!summary) {
    reasons.push("perspective_relay_review_source_mismatch");
    return uniqueStrings(reasons);
  }
  const mapping = contract.proposed_perspective_relay_mapping;
  const summaryMismatches = [
    summary.source_contract_fingerprint !== contract.validation.contract_fingerprint,
    summary.source_next_work_signal_receipt_id !==
      contract.source_next_work_signal_receipt_id,
    summary.source_next_work_signal_record_id !==
      contract.source_next_work_signal_record_id,
    summary.source_next_work_signal_record_fingerprint !==
      contract.source_next_work_signal_record_fingerprint,
    summary.source_projection_fingerprint !==
      contract.source_projection_fingerprint,
    summary.source_global_dogfood_ledger_receipt_id !==
      contract.source_global_dogfood_ledger_receipt_id,
    summary.source_metric_snapshot_receipt_id !==
      contract.source_metric_snapshot_receipt_id,
    summary.source_manual_receipt_id !== contract.source_manual_receipt_id,
    summary.source_expected_observed_delta_record_ref !==
      contract.source_expected_observed_delta_record_ref,
    summary.source_reuse_outcome_record_ref !==
      contract.source_reuse_outcome_record_ref,
    summary.proposed_idempotency_key !==
      contract.idempotency_contract_preview.proposed_idempotency_key,
    summary.relay_update_label !== mapping.relay_update_label,
    summary.recommended_next_work_label !== mapping.recommended_next_work_label,
    summary.outcome_label !== mapping.outcome_label,
    summary.outcome_signal !== mapping.outcome_signal,
    summary.future_write_mode !== contract.requested_future_write_mode,
    summary.writes_now !== false,
  ];
  if (summaryMismatches.some(Boolean)) {
    reasons.push("perspective_relay_review_source_mismatch");
  }
  return uniqueStrings(reasons);
}

function validateOperatorAuthorization(operatorAuthorization: JsonRecord) {
  const reasons: string[] = [];
  if (
    !hasText(operatorAuthorization.authorization_kind) ||
    !hasText(operatorAuthorization.operator_confirmation_text) ||
    !hasText(operatorAuthorization.write_mode)
  ) {
    reasons.push("perspective_relay_operator_authorization_shape_invalid");
  }
  if (
    operatorAuthorization.authorization_kind !==
    "manual_operator_authorized_perspective_relay_write"
  ) {
    reasons.push("operator_authorization_kind_invalid");
  }
  if (
    operatorAuthorization.operator_confirmation_text !==
    RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_RELAY_WRITE_CONFIRMATION
  ) {
    reasons.push("perspective_relay_wrong_confirmation");
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

function validateSourcesForRequest({
  db,
  request,
  ignoreRequestSuppliedReadbacks = false,
}: {
  db: RelayDbLike;
  request: ResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteRequest;
  ignoreRequestSuppliedReadbacks?: boolean;
}) {
  const reasons: string[] = [];
  const contract = request.perspective_relay_contract;
  const signal =
    readResearchCandidateManualGlobalDogfoodNextWorkSignalByReceiptId(
      contract.source_next_work_signal_receipt_id!,
      { scope: contract.scope, db },
    );
  const signalReadback = readResearchCandidateManualGlobalDogfoodNextWorkSignal({
    scope: contract.scope,
    receiptId: contract.source_next_work_signal_receipt_id,
    limit: 1,
    db,
  });
  if (!signal) {
    reasons.push("perspective_relay_source_signal_receipt_not_found");
    return reasons;
  }
  if (signal.receipt.write_status !== "committed") {
    reasons.push("perspective_relay_source_signal_receipt_not_active_committed");
  }
  if (!signal.next_work_signal_record) {
    reasons.push("perspective_relay_source_signal_record_missing");
    return reasons;
  }
  if (!sourceSignalReadbackFlagsAreClean(signalReadback)) {
    reasons.push("perspective_relay_source_readback_forbidden_mutation_flag");
  }
  if (
    !ignoreRequestSuppliedReadbacks &&
    request.source_next_work_signal_readback &&
    !sourceSignalReadbackFlagsAreClean(request.source_next_work_signal_readback)
  ) {
    reasons.push("perspective_relay_source_readback_forbidden_mutation_flag");
  }
  if (signalRecordMismatchesContract({ signal, contract })) {
    reasons.push("perspective_relay_source_signal_record_mismatch");
  }

  const sourceBias = getSourceBiasForRequest({ db, request });
  if (!sourceBias) {
    reasons.push("perspective_relay_source_bias_receipt_not_active_committed");
    return uniqueStrings(reasons);
  }
  const biasReadback = readResearchCandidateManualGlobalDogfoodNextWorkBias({
    scope: contract.scope,
    receiptId: sourceBias.receipt.receipt_id,
    limit: 1,
    db,
  });
  if (sourceBias.receipt.write_status !== "committed") {
    reasons.push("perspective_relay_source_bias_receipt_not_active_committed");
  }
  if (!sourceBias.next_work_bias_record) {
    reasons.push("perspective_relay_source_bias_record_mismatch");
    return uniqueStrings(reasons);
  }
  if (!sourceBiasReadbackFlagsAreClean(biasReadback)) {
    reasons.push("perspective_relay_source_readback_forbidden_mutation_flag");
  }
  if (
    !ignoreRequestSuppliedReadbacks &&
    request.source_next_work_bias_readback &&
    !sourceBiasReadbackFlagsAreClean(request.source_next_work_bias_readback)
  ) {
    reasons.push("perspective_relay_source_readback_forbidden_mutation_flag");
  }
  if (biasRecordMismatchesContract({ sourceBias, contract })) {
    reasons.push("perspective_relay_source_bias_record_mismatch");
  }
  return uniqueStrings(reasons);
}

function getSourceBiasForRequest({
  db,
  request,
}: {
  db: RelayDbLike;
  request: ResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteRequest;
}) {
  const biasReceiptId =
    request.source_next_work_bias_readback?.latest_active_committed?.receipt
      .receipt_id ?? null;
  if (!biasReceiptId) return null;
  return readResearchCandidateManualGlobalDogfoodNextWorkBiasByReceiptId(
    biasReceiptId,
    {
      scope: request.perspective_relay_contract.scope,
      db,
    },
  );
}

function signalRecordMismatchesContract({
  signal,
  contract,
}: {
  signal: NonNullable<
    ReturnType<typeof readResearchCandidateManualGlobalDogfoodNextWorkSignalByReceiptId>
  >;
  contract: ResearchCandidateManualGlobalDogfoodPerspectiveRelayContract;
}) {
  return (
    signal.receipt.receipt_id !== contract.source_next_work_signal_receipt_id ||
    signal.next_work_signal_record?.next_work_signal_record_id !==
      contract.source_next_work_signal_record_id ||
    signal.next_work_signal_record?.next_work_signal_record_fingerprint !==
      contract.source_next_work_signal_record_fingerprint ||
    signal.receipt.source_projection_fingerprint !==
      contract.source_projection_fingerprint ||
    signal.receipt.source_global_dogfood_ledger_receipt_id !==
      contract.source_global_dogfood_ledger_receipt_id ||
    signal.receipt.source_global_dogfood_ledger_record_id !==
      contract.source_global_dogfood_ledger_record_id ||
    signal.receipt.source_metric_snapshot_receipt_id !==
      contract.source_metric_snapshot_receipt_id ||
    signal.receipt.source_metric_snapshot_record_id !==
      contract.source_metric_snapshot_record_id ||
    signal.receipt.source_manual_receipt_id !== contract.source_manual_receipt_id ||
    signal.receipt.source_handoff_seed_fingerprint !==
      contract.source_handoff_seed_fingerprint ||
    signal.receipt.source_result_text_fingerprint !==
      contract.source_result_text_fingerprint ||
    signal.receipt.source_expected_observed_delta_record_ref !==
      contract.source_expected_observed_delta_record_ref ||
    signal.receipt.source_reuse_outcome_record_ref !==
      contract.source_reuse_outcome_record_ref
  );
}

function biasRecordMismatchesContract({
  sourceBias,
  contract,
}: {
  sourceBias: NonNullable<
    ReturnType<typeof readResearchCandidateManualGlobalDogfoodNextWorkBiasByReceiptId>
  >;
  contract: ResearchCandidateManualGlobalDogfoodPerspectiveRelayContract;
}) {
  const record = sourceBias.next_work_bias_record;
  const mapping = contract.proposed_perspective_relay_mapping;
  return (
    !record ||
    sourceBias.receipt.source_next_work_signal_receipt_id !==
      contract.source_next_work_signal_receipt_id ||
    sourceBias.receipt.source_next_work_signal_record_id !==
      contract.source_next_work_signal_record_id ||
    sourceBias.receipt.source_next_work_signal_record_fingerprint !==
      contract.source_next_work_signal_record_fingerprint ||
    sourceBias.receipt.source_projection_fingerprint !==
      contract.source_projection_fingerprint ||
    sourceBias.receipt.source_global_dogfood_ledger_receipt_id !==
      contract.source_global_dogfood_ledger_receipt_id ||
    sourceBias.receipt.source_global_dogfood_ledger_record_id !==
      contract.source_global_dogfood_ledger_record_id ||
    sourceBias.receipt.source_metric_snapshot_receipt_id !==
      contract.source_metric_snapshot_receipt_id ||
    sourceBias.receipt.source_metric_snapshot_record_id !==
      contract.source_metric_snapshot_record_id ||
    sourceBias.receipt.source_manual_receipt_id !==
      contract.source_manual_receipt_id ||
    sourceBias.receipt.source_handoff_seed_fingerprint !==
      contract.source_handoff_seed_fingerprint ||
    sourceBias.receipt.source_result_text_fingerprint !==
      contract.source_result_text_fingerprint ||
    sourceBias.receipt.source_expected_observed_delta_record_ref !==
      contract.source_expected_observed_delta_record_ref ||
    sourceBias.receipt.source_reuse_outcome_record_ref !==
      contract.source_reuse_outcome_record_ref ||
    record.recommended_next_work_label !== mapping.recommended_next_work_label ||
    record.outcome_label !== mapping.outcome_label ||
    record.outcome_signal !== mapping.outcome_signal ||
    stableJson(record.selected_candidate_context_refs) !==
      stableJson(mapping.selected_candidate_context_refs) ||
    stableJson(record.source_next_work_candidate_card_ids) !==
      stableJson(mapping.source_next_work_candidate_card_ids) ||
    stableJson(record.manual_only_context_refs) !==
      stableJson(mapping.manual_only_context_refs)
  );
}

function sourceSignalReadbackFlagsAreClean(
  readback: ResearchCandidateManualGlobalDogfoodNextWorkSignalReadback,
) {
  return (
    readback.work_or_perspective_rows_written === false &&
    readback.dogfood_metrics_written === false &&
    readback.metric_snapshot_mutated === false &&
    readback.global_dogfood_ledger_mutated === false &&
    readback.proof_or_evidence_rows_written === false &&
    readback.perspective_memory_written === false &&
    readback.product_write_executed === false &&
    readback.raw_manual_note_text_present === false &&
    readback.raw_result_report_text_present === false &&
    readback.operator_notes_persisted === false
  );
}

function sourceBiasReadbackFlagsAreClean(
  readback: ResearchCandidateManualGlobalDogfoodNextWorkBiasReadback,
) {
  return (
    readback.work_mutated === false &&
    readback.perspective_relay_written === false &&
    readback.perspective_state_written === false &&
    readback.perspective_promoted === false &&
    readback.perspective_memory_written === false &&
    readback.dogfood_metrics_written === false &&
    readback.global_dogfood_ledger_mutated === false &&
    readback.metric_snapshot_mutated === false &&
    readback.next_work_signal_decision_mutated === false &&
    readback.proof_or_evidence_rows_written === false &&
    readback.product_write_executed === false &&
    readback.raw_manual_note_text_present === false &&
    readback.raw_result_report_text_present === false &&
    readback.operator_notes_persisted === false
  );
}

function supersedePreviousReceipt({
  db,
  request,
}: {
  db: RelayDbLike;
  request: ResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteRequest;
}) {
  const supersedesReceiptId =
    request.operator_authorization.supersedes_receipt_id ?? "";
  const target =
    readResearchCandidateManualGlobalDogfoodPerspectiveRelayByReceiptId(
      supersedesReceiptId,
      { scope: request.perspective_relay_contract.scope, db },
    );
  if (!target) return "supersedes_receipt_id_not_found";
  if (target.receipt.write_status !== "committed") {
    return "supersedes_receipt_not_committed";
  }
  const update = db
    .prepare(
      `
        UPDATE research_candidate_manual_global_dogfood_perspective_relay_receipts
        SET write_status = 'superseded'
        WHERE receipt_id = ?
          AND scope = ?
          AND write_status = 'committed'
      `,
    )
    .run(supersedesReceiptId, request.perspective_relay_contract.scope);
  return getRunChangeCount(update) === 1
    ? null
    : "supersedes_receipt_not_committed";
}

function validateSupersedeTargetForRequest({
  db,
  request,
  existingReceipt,
}: {
  db: RelayDbLike;
  request: ResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteRequest;
  existingReceipt: ResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteReceipt | null;
}) {
  const supersedesReceiptId =
    request.operator_authorization.supersedes_receipt_id ?? "";
  const target =
    readResearchCandidateManualGlobalDogfoodPerspectiveRelayByReceiptId(
      supersedesReceiptId,
      { scope: request.perspective_relay_contract.scope, db },
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
  sourceBias,
  idempotencyKey,
  createdAt,
}: {
  request: ResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteRequest;
  sourceBias: NonNullable<
    ReturnType<typeof readResearchCandidateManualGlobalDogfoodNextWorkBiasByReceiptId>
  >;
  idempotencyKey: string;
  createdAt: string;
}): ResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteReceipt {
  const contract = request.perspective_relay_contract;
  const source = {
    scope: contract.scope,
    source_perspective_relay_contract_fingerprint:
      contract.validation.contract_fingerprint,
    source_perspective_relay_review_fingerprint:
      request.perspective_relay_review.validation.review_fingerprint,
    source_next_work_signal_receipt_id:
      contract.source_next_work_signal_receipt_id!,
    source_next_work_signal_record_id:
      contract.source_next_work_signal_record_id!,
    source_next_work_signal_record_fingerprint:
      contract.source_next_work_signal_record_fingerprint!,
    source_next_work_bias_receipt_id: sourceBias.receipt.receipt_id,
    source_next_work_bias_record_id:
      sourceBias.next_work_bias_record!.next_work_bias_record_id,
    source_next_work_bias_record_fingerprint:
      sourceBias.next_work_bias_record!.next_work_bias_record_fingerprint,
    source_projection_fingerprint: contract.source_projection_fingerprint!,
    source_global_dogfood_ledger_receipt_id:
      contract.source_global_dogfood_ledger_receipt_id!,
    source_global_dogfood_ledger_record_id:
      contract.source_global_dogfood_ledger_record_id!,
    source_metric_snapshot_receipt_id:
      contract.source_metric_snapshot_receipt_id!,
    source_metric_snapshot_record_id: contract.source_metric_snapshot_record_id!,
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
  const receiptId = `manual-global-dogfood-perspective-relay-receipt:${fingerprint({
    ...source,
    created_at: createdAt,
  })}`;
  return {
    receipt_id: receiptId,
    created_at: createdAt,
    ...source,
    write_status: "committed",
    authority_profile: AUTHORITY_PROFILE,
    receipt_fingerprint: fingerprint({ ...source, receipt_id: receiptId }),
    rollback_of_receipt_id: null,
    rollback_reason: null,
  };
}

function buildPerspectiveRelayRecord({
  request,
  sourceBias,
  receipt,
  createdAt,
}: {
  request: ResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteRequest;
  sourceBias: NonNullable<
    ReturnType<typeof readResearchCandidateManualGlobalDogfoodNextWorkBiasByReceiptId>
  >;
  receipt: ResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteReceipt;
  createdAt: string;
}): ResearchCandidateManualGlobalDogfoodPerspectiveRelayRecord {
  const contract = request.perspective_relay_contract;
  const mapping = contract.proposed_perspective_relay_mapping;
  const sourceRefs = uniqueStrings([
    contract.source_next_work_signal_readback_ref,
    contract.source_next_work_signal_receipt_id,
    contract.source_next_work_signal_record_id,
    contract.source_next_work_signal_record_fingerprint,
    sourceBias.receipt.receipt_id,
    sourceBias.next_work_bias_record?.next_work_bias_record_id,
    sourceBias.next_work_bias_record?.next_work_bias_record_fingerprint,
    contract.source_projection_fingerprint,
    contract.source_global_dogfood_ledger_receipt_id,
    contract.source_global_dogfood_ledger_record_id,
    contract.source_metric_snapshot_receipt_id,
    contract.source_metric_snapshot_record_id,
    contract.source_manual_receipt_id,
    contract.source_handoff_seed_fingerprint,
    contract.source_result_text_fingerprint,
    contract.source_expected_observed_delta_record_ref,
    contract.source_reuse_outcome_record_ref,
    contract.validation.contract_fingerprint,
    request.perspective_relay_review.validation.review_fingerprint,
    ...mapping.source_next_work_candidate_card_ids,
    ...mapping.selected_candidate_context_refs,
    ...mapping.manual_only_context_refs,
  ]);
  const source = {
    receipt_id: receipt.receipt_id,
    scope: contract.scope,
    source_next_work_signal_receipt_id:
      contract.source_next_work_signal_receipt_id!,
    source_next_work_signal_record_id:
      contract.source_next_work_signal_record_id!,
    source_next_work_bias_receipt_id: sourceBias.receipt.receipt_id,
    source_next_work_bias_record_id:
      sourceBias.next_work_bias_record!.next_work_bias_record_id,
    source_projection_fingerprint: contract.source_projection_fingerprint!,
    source_global_dogfood_ledger_receipt_id:
      contract.source_global_dogfood_ledger_receipt_id!,
    source_global_dogfood_ledger_record_id:
      contract.source_global_dogfood_ledger_record_id!,
    source_metric_snapshot_receipt_id:
      contract.source_metric_snapshot_receipt_id!,
    source_metric_snapshot_record_id: contract.source_metric_snapshot_record_id!,
    relay_update_label: mapping.relay_update_label!,
    relay_update_rationale: mapping.relay_update_rationale!,
    recommended_next_work_label: mapping.recommended_next_work_label!,
    outcome_label: mapping.outcome_label!,
    outcome_signal: mapping.outcome_signal!,
    expected_summary: mapping.expected_summary,
    observed_summary: mapping.observed_summary,
    mismatch_or_gap_summary: mapping.mismatch_or_gap_summary,
    selected_candidate_context_refs: mapping.selected_candidate_context_refs,
    source_next_work_candidate_card_ids:
      mapping.source_next_work_candidate_card_ids,
    manual_only_context_refs: mapping.manual_only_context_refs,
    source_line: mapping.source_line,
    blockers: mapping.blockers,
    warnings: mapping.warnings,
    source_refs: sourceRefs,
  };
  const recordId = `manual-global-dogfood-perspective-relay-record:${fingerprint({
    ...source,
    created_at: createdAt,
  })}`;
  return {
    perspective_relay_record_id: recordId,
    created_at: createdAt,
    ...source,
    outcome_signal: source.outcome_signal as "positive" | "negative" | "ambiguous",
    authority_profile: AUTHORITY_PROFILE,
    perspective_relay_record_fingerprint: fingerprint({
      ...source,
      perspective_relay_record_id: recordId,
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
}): ResearchCandidateManualGlobalDogfoodPerspectiveRelayRollbackRecord {
  const rollbackId = `manual-global-dogfood-perspective-relay-rollback:${fingerprint({
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
  db: RelayDbLike,
  receipt: ResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteReceipt,
) {
  db.prepare(
    `
      INSERT INTO research_candidate_manual_global_dogfood_perspective_relay_receipts (
        receipt_id,
        created_at,
        scope,
        source_perspective_relay_contract_fingerprint,
        source_perspective_relay_review_fingerprint,
        source_next_work_signal_receipt_id,
        source_next_work_signal_record_id,
        source_next_work_signal_record_fingerprint,
        source_next_work_bias_receipt_id,
        source_next_work_bias_record_id,
        source_next_work_bias_record_fingerprint,
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
        @source_perspective_relay_contract_fingerprint,
        @source_perspective_relay_review_fingerprint,
        @source_next_work_signal_receipt_id,
        @source_next_work_signal_record_id,
        @source_next_work_signal_record_fingerprint,
        @source_next_work_bias_receipt_id,
        @source_next_work_bias_record_id,
        @source_next_work_bias_record_fingerprint,
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

function insertPerspectiveRelayRecord(
  db: RelayDbLike,
  record: ResearchCandidateManualGlobalDogfoodPerspectiveRelayRecord,
) {
  db.prepare(
    `
      INSERT INTO research_candidate_manual_global_dogfood_perspective_relay_records (
        perspective_relay_record_id,
        receipt_id,
        created_at,
        scope,
        source_next_work_signal_receipt_id,
        source_next_work_signal_record_id,
        source_next_work_bias_receipt_id,
        source_next_work_bias_record_id,
        source_projection_fingerprint,
        source_global_dogfood_ledger_receipt_id,
        source_global_dogfood_ledger_record_id,
        source_metric_snapshot_receipt_id,
        source_metric_snapshot_record_id,
        relay_update_label,
        relay_update_rationale,
        recommended_next_work_label,
        outcome_label,
        outcome_signal,
        expected_summary,
        observed_summary,
        mismatch_or_gap_summary,
        selected_candidate_context_refs_json,
        source_next_work_candidate_card_ids_json,
        manual_only_context_refs_json,
        source_line,
        blockers_json,
        warnings_json,
        source_refs_json,
        authority_profile,
        perspective_relay_record_fingerprint
      )
      VALUES (
        @perspective_relay_record_id,
        @receipt_id,
        @created_at,
        @scope,
        @source_next_work_signal_receipt_id,
        @source_next_work_signal_record_id,
        @source_next_work_bias_receipt_id,
        @source_next_work_bias_record_id,
        @source_projection_fingerprint,
        @source_global_dogfood_ledger_receipt_id,
        @source_global_dogfood_ledger_record_id,
        @source_metric_snapshot_receipt_id,
        @source_metric_snapshot_record_id,
        @relay_update_label,
        @relay_update_rationale,
        @recommended_next_work_label,
        @outcome_label,
        @outcome_signal,
        @expected_summary,
        @observed_summary,
        @mismatch_or_gap_summary,
        @selected_candidate_context_refs_json,
        @source_next_work_candidate_card_ids_json,
        @manual_only_context_refs_json,
        @source_line,
        @blockers_json,
        @warnings_json,
        @source_refs_json,
        @authority_profile,
        @perspective_relay_record_fingerprint
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
    manual_only_context_refs_json: JSON.stringify(record.manual_only_context_refs),
    blockers_json: JSON.stringify(record.blockers),
    warnings_json: JSON.stringify(record.warnings),
    source_refs_json: JSON.stringify(record.source_refs),
  });
}

function insertRollback(
  db: RelayDbLike,
  rollback: ResearchCandidateManualGlobalDogfoodPerspectiveRelayRollbackRecord,
) {
  db.prepare(
    `
      INSERT INTO research_candidate_manual_global_dogfood_perspective_relay_rollbacks (
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
  validation: ResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteValidation;
  readback: ReturnType<
    typeof readResearchCandidateManualGlobalDogfoodPerspectiveRelay
  >;
}): ResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteResult {
  const existing = readback.records_by_receipt[0];
  return {
    ok: true,
    result_status: "duplicate_replayed",
    validation,
    receipt: existing?.receipt ?? null,
    perspective_relay_record: existing?.perspective_relay_record ?? null,
    readback,
    refusal_reasons: [],
    duplicate_replayed: true,
    idempotency_key: validation.idempotency_key,
    authority_boundary:
      getResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteAuthorityBoundary(),
    ...writeResultFlags(Boolean(existing)),
  };
}

function refusedResult({
  validation,
  idempotencyKey,
}: {
  validation: ResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteValidation;
  idempotencyKey: string | null;
}): ResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteResult {
  return {
    ok: false,
    result_status: "refused",
    validation,
    receipt: null,
    perspective_relay_record: null,
    readback: null,
    refusal_reasons: validation.failure_codes,
    duplicate_replayed: false,
    idempotency_key: idempotencyKey,
    authority_boundary:
      getResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteAuthorityBoundary(),
    ...writeResultFlags(false),
  };
}

function rollbackRefused(
  refusalReasons: string[],
): ResearchCandidateManualGlobalDogfoodPerspectiveRelayRollbackResult {
  return {
    ok: false,
    result_status: "refused",
    rollback: null,
    receipt: null,
    readback: null,
    refusal_reasons: uniqueStrings(refusalReasons),
    authority_boundary:
      getResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteAuthorityBoundary(),
    ...writeResultFlags(false),
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
}): ResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteValidation {
  const uniqueFailureCodes = uniqueStrings(failureCodes);
  return {
    passed: uniqueFailureCodes.length === 0,
    failure_codes: uniqueFailureCodes,
    idempotency_key: idempotencyKey,
    exact_operator_confirmation_present:
      isRecord(request?.operator_authorization) &&
      request?.operator_authorization.operator_confirmation_text ===
        RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_RELAY_WRITE_CONFIRMATION,
    ready_perspective_relay_contract_present:
      isRecord(request?.perspective_relay_contract) &&
      request?.perspective_relay_contract.operator_authorization_mode ===
        "ready_for_future_perspective_relay_write_authorization",
    accepted_perspective_relay_review_present:
      isRecord(request?.perspective_relay_review) &&
      request?.perspective_relay_review.review_status ===
        "ready_for_future_perspective_relay_write_slice",
    preview_contract_remained_non_writing:
      isRecord(request?.perspective_relay_contract) &&
      contractNonWriteConfirmationStillClean(
        request.perspective_relay_contract as unknown as ResearchCandidateManualGlobalDogfoodPerspectiveRelayContract,
      ),
    preview_authority_boundary_was_read_only:
      isRecord(request?.perspective_relay_contract) &&
      contractAuthorityBoundaryStillReadOnly(
        request.perspective_relay_contract as unknown as Pick<
          ResearchCandidateManualGlobalDogfoodPerspectiveRelayContract,
          "authority_boundary"
        >,
      ),
    writer_authority_boundary_is_narrow: writerAuthorityBoundaryIsNarrow(),
    raw_text_fields_absent: !containsRawTextField(request),
    operator_note_absent: !containsOperatorNoteField(request),
    source_refs_present:
      isRecord(request?.perspective_relay_contract) &&
      sourceRefsPresent(
        request.perspective_relay_contract as unknown as ResearchCandidateManualGlobalDogfoodPerspectiveRelayContract,
      ),
    source_next_work_signal_receipt_active_committed:
      !uniqueFailureCodes.includes(
        "perspective_relay_source_signal_receipt_not_active_committed",
      ) &&
      !uniqueFailureCodes.includes(
        "perspective_relay_source_signal_receipt_not_found",
      ),
    source_next_work_signal_record_matches_contract:
      !uniqueFailureCodes.includes(
        "perspective_relay_source_signal_record_mismatch",
      ),
    source_next_work_bias_receipt_active_committed:
      !uniqueFailureCodes.includes(
        "perspective_relay_source_bias_receipt_not_active_committed",
      ) &&
      !uniqueFailureCodes.includes("perspective_relay_source_bias_receipt_not_found"),
    source_next_work_bias_record_matches_contract:
      !uniqueFailureCodes.includes(
        "perspective_relay_source_bias_record_mismatch",
      ),
    source_readback_flags_preserve_no_forbidden_mutation:
      !uniqueFailureCodes.includes(
        "perspective_relay_source_readback_forbidden_mutation_flag",
      ),
    relay_update_label_present:
      isRecord(request?.perspective_relay_contract) &&
      isRecord(
        request.perspective_relay_contract.proposed_perspective_relay_mapping,
      ) &&
      hasText(
        request.perspective_relay_contract.proposed_perspective_relay_mapping
          .relay_update_label,
      ),
    selected_candidate_context_refs_present:
      isRecord(request?.perspective_relay_contract) &&
      isRecord(
        request.perspective_relay_contract.proposed_perspective_relay_mapping,
      ) &&
      Array.isArray(
        request.perspective_relay_contract.proposed_perspective_relay_mapping
          .selected_candidate_context_refs,
      ) &&
      request.perspective_relay_contract.proposed_perspective_relay_mapping
        .selected_candidate_context_refs.length > 0,
    source_next_work_candidate_card_ids_present:
      isRecord(request?.perspective_relay_contract) &&
      isRecord(
        request.perspective_relay_contract.proposed_perspective_relay_mapping,
      ) &&
      Array.isArray(
        request.perspective_relay_contract.proposed_perspective_relay_mapping
          .source_next_work_candidate_card_ids,
      ) &&
      request.perspective_relay_contract.proposed_perspective_relay_mapping
        .source_next_work_candidate_card_ids.length > 0,
    proposed_relay_candidate_ready:
      isRecord(request?.perspective_relay_contract) &&
      isRecord(request.perspective_relay_contract.proposed_relay_update_candidate) &&
      request.perspective_relay_contract.proposed_relay_update_candidate
        .candidate_status ===
        "ready_for_future_perspective_relay_write_authorization",
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
    "manual_operator_authorized_perspective_relay_rollback"
  ) {
    reasons.push("rollback_authorization_kind_invalid");
  }
  if (
    authorization.operator_confirmation_text !==
    RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_RELAY_ROLLBACK_CONFIRMATION
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

function computePerspectiveRelayIdempotencyKey({
  contract,
  sourceBias,
}: {
  contract: ResearchCandidateManualGlobalDogfoodPerspectiveRelayContract;
  sourceBias: NonNullable<
    ResearchCandidateManualGlobalDogfoodNextWorkBiasReadback["latest_active_committed"]
  >;
}) {
  const mapping = contract.proposed_perspective_relay_mapping;
  return `manual-global-dogfood-perspective-relay:${fingerprint({
    write_version:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_RELAY_WRITE_VERSION,
    perspective_relay_contract_fingerprint:
      contract.validation.contract_fingerprint,
    source_next_work_signal_receipt_id:
      contract.source_next_work_signal_receipt_id,
    source_next_work_signal_record_id:
      contract.source_next_work_signal_record_id,
    source_next_work_signal_record_fingerprint:
      contract.source_next_work_signal_record_fingerprint,
    source_next_work_bias_receipt_id: sourceBias.receipt.receipt_id,
    source_next_work_bias_record_id:
      sourceBias.next_work_bias_record?.next_work_bias_record_id ?? null,
    source_next_work_bias_record_fingerprint:
      sourceBias.next_work_bias_record?.next_work_bias_record_fingerprint ?? null,
    source_projection_fingerprint: contract.source_projection_fingerprint,
    source_global_dogfood_ledger_receipt_id:
      contract.source_global_dogfood_ledger_receipt_id,
    source_global_dogfood_ledger_record_id:
      contract.source_global_dogfood_ledger_record_id,
    source_metric_snapshot_receipt_id:
      contract.source_metric_snapshot_receipt_id,
    source_metric_snapshot_record_id: contract.source_metric_snapshot_record_id,
    source_manual_receipt_id: contract.source_manual_receipt_id,
    source_handoff_seed_fingerprint: contract.source_handoff_seed_fingerprint,
    source_result_text_fingerprint: contract.source_result_text_fingerprint,
    source_expected_observed_delta_record_ref:
      contract.source_expected_observed_delta_record_ref,
    source_reuse_outcome_record_ref: contract.source_reuse_outcome_record_ref,
    relay_update_label: mapping.relay_update_label,
    relay_update_rationale: mapping.relay_update_rationale,
    recommended_next_work_label: mapping.recommended_next_work_label,
    outcome_label: mapping.outcome_label,
    outcome_signal: mapping.outcome_signal,
    selected_candidate_context_refs: mapping.selected_candidate_context_refs,
    source_next_work_candidate_card_ids:
      mapping.source_next_work_candidate_card_ids,
    manual_only_context_refs: mapping.manual_only_context_refs,
    expected_summary: mapping.expected_summary,
    observed_summary: mapping.observed_summary,
    mismatch_or_gap_summary: mapping.mismatch_or_gap_summary,
    source_line: mapping.source_line,
  })}`;
}

function validationWithFailures(
  validation: ResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteValidation,
  failures: string[],
): ResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteValidation {
  return validationResult({
    failureCodes: [...validation.failure_codes, ...failures],
    idempotencyKey: validation.idempotency_key,
    request: null,
  });
}

function contractNonWriteConfirmationStillClean(
  contract: Pick<
    ResearchCandidateManualGlobalDogfoodPerspectiveRelayContract,
    "non_write_confirmation"
  >,
) {
  if (!isRecord(contract.non_write_confirmation)) return false;
  return Object.values(contract.non_write_confirmation).every(
    (value) => value === false,
  );
}

function contractAuthorityBoundaryStillReadOnly(
  contract: Pick<
    ResearchCandidateManualGlobalDogfoodPerspectiveRelayContract,
    "authority_boundary"
  >,
) {
  const boundary = contract.authority_boundary;
  if (!isRecord(boundary)) return false;
  return (
    boundary.preview_only === true &&
    boundary.read_only === true &&
    boundary.can_write_perspective_relay === false &&
    boundary.can_write_perspective_state === false &&
    boundary.can_promote_perspective === false &&
    boundary.can_write_perspective_memory === false &&
    boundary.can_write_next_work_bias === false &&
    boundary.can_write_work_item === false &&
    boundary.can_mutate_work === false &&
    boundary.can_write_dogfood_metrics === false &&
    boundary.can_write_global_dogfood_ledger === false &&
    boundary.can_write_metric_snapshot === false &&
    boundary.can_write_next_work_signal_decision === false &&
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
    getResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteAuthorityBoundary();
  return (
    boundary.can_write_perspective_relay_record === true &&
    boundary.can_write_perspective_relay_receipt === true &&
    boundary.can_write_perspective_relay_rollback_metadata === true &&
    boundary.can_write_perspective_state === false &&
    boundary.can_promote_perspective === false &&
    boundary.can_write_perspective_memory === false &&
    boundary.can_write_next_work_bias === false &&
    boundary.can_mutate_next_work_bias === false &&
    boundary.can_write_work_item === false &&
    boundary.can_mutate_work === false &&
    boundary.can_write_dogfood_metrics === false &&
    boundary.can_write_global_dogfood_ledger === false &&
    boundary.can_write_metric_snapshot === false &&
    boundary.can_write_next_work_signal_decision === false &&
    boundary.can_write_proof_or_evidence === false &&
    boundary.can_execute_product_write === false
  );
}

function sourceRefsPresent(
  contract: ResearchCandidateManualGlobalDogfoodPerspectiveRelayContract,
) {
  return [
    contract.source_next_work_signal_receipt_id,
    contract.source_next_work_signal_record_id,
    contract.source_next_work_signal_record_fingerprint,
    contract.source_projection_fingerprint,
    contract.source_global_dogfood_ledger_receipt_id,
    contract.source_global_dogfood_ledger_record_id,
    contract.source_metric_snapshot_receipt_id,
    contract.source_metric_snapshot_record_id,
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
    .map(([key]) => `perspective_relay_requested_side_effects_refused:${key}`);
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

function writeResultFlags(hasRelayRows: boolean) {
  return {
    perspective_relay_written: hasRelayRows,
    perspective_state_written: false,
    perspective_promoted: false,
    perspective_memory_written: false,
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

function rollbackWriteTransaction(db: RelayDbLike) {
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
