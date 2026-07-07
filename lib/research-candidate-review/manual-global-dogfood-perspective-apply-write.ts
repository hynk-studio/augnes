import { openDatabase } from "@/lib/db";
import {
  ensureResearchCandidateManualGlobalDogfoodPerspectiveApplySchema,
  getResearchCandidateManualGlobalDogfoodPerspectiveApplyWriteAuthorityBoundary,
  readResearchCandidateManualGlobalDogfoodPerspectiveApply,
  readResearchCandidateManualGlobalDogfoodPerspectiveApplyByReceiptId,
  type ResearchCandidateManualGlobalDogfoodPerspectiveApplyDbLike,
} from "@/lib/research-candidate-review/read-manual-global-dogfood-perspective-apply";
import {
  ensureResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateSchema,
  readResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdate,
  readResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateByReceiptId,
} from "@/lib/research-candidate-review/read-manual-global-dogfood-canonical-perspective-update";
import type {
  ResearchCandidateManualGlobalDogfoodPerspectiveApplyContract,
} from "@/types/research-candidate-manual-global-dogfood-perspective-apply-contract";
import type {
  ResearchCandidateManualGlobalDogfoodPerspectiveApplyReview,
} from "@/types/research-candidate-manual-global-dogfood-perspective-apply-review";
import {
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_APPLY_ROLLBACK_CONFIRMATION,
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_APPLY_WRITE_CONFIRMATION,
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_APPLY_WRITE_VERSION,
  type ResearchCandidateManualGlobalDogfoodPerspectiveApplyRecord,
  type ResearchCandidateManualGlobalDogfoodPerspectiveApplyRollbackRecord,
  type ResearchCandidateManualGlobalDogfoodPerspectiveApplyRollbackResult,
  type ResearchCandidateManualGlobalDogfoodPerspectiveApplyWriteReceipt,
  type ResearchCandidateManualGlobalDogfoodPerspectiveApplyWriteRequest,
  type ResearchCandidateManualGlobalDogfoodPerspectiveApplyWriteResult,
  type ResearchCandidateManualGlobalDogfoodPerspectiveApplyWriteValidation,
} from "@/types/research-candidate-manual-global-dogfood-perspective-apply-write";
import type { ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReadback } from "@/types/research-candidate-manual-global-dogfood-canonical-perspective-update-write";

type PerspectiveApplyDbLike =
  ResearchCandidateManualGlobalDogfoodPerspectiveApplyDbLike;
type JsonRecord = Record<string, unknown>;

const FINGERPRINT_ALGORITHM = "fnv1a32_canonical_json_v0_1" as const;
const AUTHORITY_PROFILE =
  "manual_global_dogfood_perspective_apply_write_authority.v0.1";
const SUPPORTED_OUTCOME_SIGNALS = new Set(["positive", "negative", "ambiguous"]);
const SUPPORTED_UPDATE_STRENGTHS = new Set(["low", "medium", "high"]);
const SUPPORTED_APPLY_TARGETS = new Set([
  "canonical_perspective_state",
  "current_working_perspective",
  "blocked",
]);
const SUPPORTED_APPLY_STRENGTH_HINTS = new Set([
  "low",
  "medium",
  "high",
  "blocked",
]);
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
  /canonical.*perspective.*(state|write|mutate)/i,
  /current.*working.*perspective/i,
  /perspective.*(promotion|promote|memory|relay.*mutate)/i,
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

export function writeResearchCandidateManualGlobalDogfoodPerspectiveApply(
  request: unknown,
  options: { db?: PerspectiveApplyDbLike } = {},
): ResearchCandidateManualGlobalDogfoodPerspectiveApplyWriteResult {
  const validation =
    validateResearchCandidateManualGlobalDogfoodPerspectiveApplyWriteRequest(
      request,
    );
  if (!validation.passed || !isRecord(request)) {
    return refusedResult({ validation, idempotencyKey: validation.idempotency_key });
  }

  const typedRequest =
    request as unknown as ResearchCandidateManualGlobalDogfoodPerspectiveApplyWriteRequest;
  const contract = typedRequest.perspective_apply_contract;
  const db = options.db ?? (openDatabase() as unknown as PerspectiveApplyDbLike);
  const ownsDb = !options.db;

  try {
    ensureResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateSchema(db);
    ensureResearchCandidateManualGlobalDogfoodPerspectiveApplySchema(db);

    const earlySourceFailures = validateSourcesForRequest({ db, request: typedRequest });
    if (earlySourceFailures.length > 0) {
      return refusedResult({
        validation: validationWithFailures(validation, earlySourceFailures),
        idempotencyKey: validation.idempotency_key,
      });
    }

    const createdAt = new Date().toISOString();
    const sourceCanonicalUpdate = getSourceCanonicalUpdateForRequest({ db, request: typedRequest });
    const receipt = buildReceipt({
      request: typedRequest,
      sourceCanonicalUpdate: sourceCanonicalUpdate!,
      idempotencyKey: validation.idempotency_key!,
      createdAt,
    });
    const canonicalUpdateRecord = buildPerspectiveApplyRecord({
      request: typedRequest,
      sourceCanonicalUpdate: sourceCanonicalUpdate!,
      receipt,
      createdAt,
    });

    let transactionStarted = false;
    try {
      db.prepare("BEGIN IMMEDIATE").run();
      transactionStarted = true;

      const existingReadback =
        readResearchCandidateManualGlobalDogfoodPerspectiveApply({
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
      insertPerspectiveApplyRecord(db, canonicalUpdateRecord);
      db.prepare("COMMIT").run();
      transactionStarted = false;
    } catch {
      if (transactionStarted) rollbackWriteTransaction(db);
      const duplicateReadback =
        readResearchCandidateManualGlobalDogfoodPerspectiveApply({
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
      perspective_apply_record: canonicalUpdateRecord,
      readback:
        readResearchCandidateManualGlobalDogfoodPerspectiveApply({
          scope: contract.scope,
          receiptId: receipt.receipt_id,
          limit: 1,
          db,
        }),
      refusal_reasons: [],
      duplicate_replayed: false,
      idempotency_key: validation.idempotency_key,
      authority_boundary:
        getResearchCandidateManualGlobalDogfoodPerspectiveApplyWriteAuthorityBoundary(),
      ...writeResultFlags(true),
    };
  } finally {
    if (ownsDb && "close" in db && typeof db.close === "function") {
      db.close();
    }
  }
}

export function rollbackResearchCandidateManualGlobalDogfoodPerspectiveApplyReceipt(
  request: unknown,
  options: { db?: PerspectiveApplyDbLike } = {},
): ResearchCandidateManualGlobalDogfoodPerspectiveApplyRollbackResult {
  const refusalReasons = validateRollbackRequest(request);
  const db = options.db ?? (openDatabase() as unknown as PerspectiveApplyDbLike);
  const ownsDb = !options.db;
  try {
    ensureResearchCandidateManualGlobalDogfoodPerspectiveApplySchema(db);
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
        readResearchCandidateManualGlobalDogfoodPerspectiveApplyByReceiptId(
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
          readback:
            readResearchCandidateManualGlobalDogfoodPerspectiveApply({
              scope: existing.receipt.scope,
              receiptId,
              limit: 1,
              db,
            }),
          refusal_reasons: [],
          authority_boundary:
            getResearchCandidateManualGlobalDogfoodPerspectiveApplyWriteAuthorityBoundary(),
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
            UPDATE research_candidate_manual_global_dogfood_perspective_apply_receipts
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
      const readback =
        readResearchCandidateManualGlobalDogfoodPerspectiveApply({
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
          getResearchCandidateManualGlobalDogfoodPerspectiveApplyWriteAuthorityBoundary(),
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

export function validateResearchCandidateManualGlobalDogfoodPerspectiveApplyWriteRequest(
  request: unknown,
): ResearchCandidateManualGlobalDogfoodPerspectiveApplyWriteValidation {
  const reasons: string[] = [];
  if (!isRecord(request)) {
    return validationResult({
      failureCodes: ["request_must_be_object"],
      idempotencyKey: null,
      request: null,
    });
  }

  const contractRecord = isRecord(request.perspective_apply_contract)
    ? request.perspective_apply_contract
    : null;
  const reviewRecord = isRecord(request.perspective_apply_review)
    ? request.perspective_apply_review
    : null;
  const operatorAuthorization = isRecord(request.operator_authorization)
    ? request.operator_authorization
    : null;
  if (!contractRecord) {
    reasons.push("perspective_apply_contract_shape_invalid");
  }
  if (!reviewRecord) reasons.push("perspective_apply_review_shape_invalid");
  if (!operatorAuthorization) {
    reasons.push(
      "perspective_apply_operator_authorization_shape_invalid",
    );
  }

  const contractShapeReasons = contractRecord
    ? validateContractShape(contractRecord)
    : [];
  const reviewShapeReasons = reviewRecord ? validateReviewShape(reviewRecord) : [];
  reasons.push(...contractShapeReasons, ...reviewShapeReasons);

  const contract =
    contractRecord && contractShapeReasons.length === 0
      ? (contractRecord as unknown as ResearchCandidateManualGlobalDogfoodPerspectiveApplyContract)
      : null;
  const review =
    reviewRecord && reviewShapeReasons.length === 0
      ? (reviewRecord as unknown as ResearchCandidateManualGlobalDogfoodPerspectiveApplyReview)
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

  const sourceReadback = isRecord(request.source_canonical_perspective_update_readback)
    ? (request.source_canonical_perspective_update_readback as unknown as ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReadback)
    : null;
  if (sourceReadback && !sourceCanonicalUpdateReadbackFlagsAreClean(sourceReadback)) {
    reasons.push("perspective_apply_source_readback_forbidden_mutation_flag");
  }

  const idempotencyKey = contract
    ? computePerspectiveApplyIdempotencyKey(contract)
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
    reasons.push("perspective_apply_contract_shape_invalid");
  }
  if (!isRecord(contract.authority_boundary)) {
    reasons.push("perspective_apply_contract_shape_invalid");
  }
  if (!isRecord(contract.non_write_confirmation)) {
    reasons.push("perspective_apply_contract_shape_invalid");
  }
  if (!isRecord(contract.idempotency_contract_preview)) {
    reasons.push("perspective_apply_contract_shape_invalid");
  }
  const mapping = isRecord(contract.proposed_perspective_apply_mapping)
    ? contract.proposed_perspective_apply_mapping
    : null;
  if (!mapping) {
    reasons.push("perspective_apply_mapping_shape_invalid");
  } else {
    if (
      !hasText(mapping.apply_label) ||
      !hasText(mapping.apply_rationale) ||
      !hasText(mapping.canonical_update_label) ||
      !hasText(mapping.canonical_update_rationale) ||
      !hasText(mapping.relay_update_label) ||
      !hasText(mapping.relay_update_rationale) ||
      !hasText(mapping.recommended_next_work_label) ||
      !SUPPORTED_APPLY_TARGETS.has(String(mapping.intended_future_apply_target)) ||
      mapping.can_feed_future_perspective_apply_write_candidate !== true ||
      mapping.can_update_current_working_perspective_now !== false ||
      mapping.can_write_canonical_perspective_state_now !== false ||
      mapping.can_promote_perspective_now !== false ||
      mapping.can_write_perspective_memory_now !== false ||
      mapping.can_mutate_work_now !== false ||
      mapping.can_write_proof_or_evidence_now !== false ||
      mapping.can_mutate_source_records_now !== false
    ) {
      reasons.push("perspective_apply_mapping_shape_invalid");
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
        reasons.push("perspective_apply_mapping_shape_invalid");
      }
    }
  }
  const candidate = isRecord(contract.proposed_apply_candidate)
    ? contract.proposed_apply_candidate
    : null;
  if (
    !candidate ||
    !hasText(candidate.candidate_status) ||
    !SUPPORTED_APPLY_TARGETS.has(String(candidate.apply_scope_hint)) ||
    !SUPPORTED_APPLY_STRENGTH_HINTS.has(String(candidate.apply_strength_hint)) ||
    !hasText(candidate.reason) ||
    candidate.writes_now !== false ||
    candidate.would_update_current_working_perspective !== false ||
    candidate.would_write_canonical_perspective_state !== false ||
    candidate.would_promote_perspective !== false ||
    candidate.would_write_perspective_memory !== false ||
    candidate.would_mutate_work !== false ||
    candidate.would_write_proof_or_evidence !== false
  ) {
    reasons.push("perspective_apply_mapping_shape_invalid");
  }
  for (const arrayField of [
    "blocker_reasons",
    "warning_reasons",
    "compatibility_findings",
  ]) {
    if (!Array.isArray(contract[arrayField])) {
      reasons.push("perspective_apply_contract_shape_invalid");
    }
  }
  return uniqueStrings(reasons);
}

function validateContract(
  contract: ResearchCandidateManualGlobalDogfoodPerspectiveApplyContract,
) {
  const reasons: string[] = [];
  const mapping = contract.proposed_perspective_apply_mapping;
  const candidate = contract.proposed_apply_candidate;
  if (
    contract.operator_authorization_mode !==
    "ready_for_future_perspective_apply_write_authorization"
  ) {
    reasons.push("perspective_apply_contract_not_ready");
  }
  if (contract.validation.passed !== true) {
    reasons.push("perspective_apply_contract_not_ready");
  }
  if (contract.blocker_reasons.length > 0) {
    reasons.push("perspective_apply_contract_not_ready");
  }
  if (!contractNonWriteConfirmationStillClean(contract)) {
    reasons.push("perspective_apply_contract_non_write_confirmation_invalid");
  }
  if (!contractAuthorityBoundaryStillReadOnly(contract)) {
    reasons.push(
      "perspective_apply_contract_authority_boundary_not_preview_only",
    );
  }
  if (!sourceRefsPresent(contract)) {
    reasons.push("source_refs_missing");
  }
  if (!hasText(mapping.apply_label)) {
    reasons.push("apply_label_missing");
  }
  if (!hasText(mapping.apply_rationale)) {
    reasons.push("apply_rationale_missing");
  }
  if (!hasText(mapping.canonical_update_label)) {
    reasons.push("canonical_update_label_missing");
  }
  if (!hasText(mapping.canonical_update_rationale)) {
    reasons.push("canonical_update_rationale_missing");
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
    !mapping.expected_summary?.trim() ||
    !mapping.observed_summary?.trim() ||
    !mapping.mismatch_or_gap_summary?.trim()
  ) {
    reasons.push("perspective_apply_explanation_insufficient");
  }
  if (
    candidate.candidate_status !==
    "ready_for_future_perspective_apply_write_authorization"
  ) {
    reasons.push("perspective_apply_contract_not_ready");
  }
  if (candidate.apply_scope_hint !== "canonical_perspective_state") {
    reasons.push("perspective_apply_scope_hint_must_be_canonical_state");
  }
  if (mapping.intended_future_apply_target !== "canonical_perspective_state") {
    reasons.push("perspective_apply_target_must_be_canonical_state");
  }
  if (!SUPPORTED_UPDATE_STRENGTHS.has(candidate.apply_strength_hint)) {
    reasons.push("perspective_apply_contract_not_ready");
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
    reasons.push("perspective_apply_review_shape_invalid");
  }
  const validation = isRecord(review.validation) ? review.validation : null;
  if (
    !validation ||
    typeof validation.passed !== "boolean" ||
    typeof validation.no_write_authority !== "boolean" ||
    typeof validation.operator_note_persisted !== "boolean" ||
    !hasText(validation.review_fingerprint)
  ) {
    reasons.push("perspective_apply_review_shape_invalid");
  }
  if (!isRecord(review.authority_boundary)) {
    reasons.push("perspective_apply_review_shape_invalid");
  }
  if (
    review.accepted_mapping_summary !== null &&
    review.accepted_mapping_summary !== undefined &&
    !isRecord(review.accepted_mapping_summary)
  ) {
    reasons.push("perspective_apply_review_shape_invalid");
  }
  return uniqueStrings(reasons);
}

function validateReview(
  review: ResearchCandidateManualGlobalDogfoodPerspectiveApplyReview,
) {
  const reasons: string[] = [];
  if (
    review.review_status !==
    "ready_for_future_perspective_apply_write_slice"
  ) {
    reasons.push(
      "perspective_apply_review_not_ready_for_future_write_slice",
    );
  }
  if (review.validation.passed !== true) {
    reasons.push("perspective_apply_review_validation_not_passed");
  }
  if (review.validation.no_write_authority !== true) {
    reasons.push(
      "perspective_apply_review_no_write_authority_not_preserved",
    );
  }
  if (
    review.operator_decision !==
    "accept_contract_for_future_perspective_apply_write_slice"
  ) {
    reasons.push("perspective_apply_review_operator_decision_not_accept");
  }
  if (review.validation.operator_note_persisted !== false) {
    reasons.push("perspective_apply_review_operator_note_persisted");
  }
  if (!contractAuthorityBoundaryStillReadOnly({ authority_boundary: review.authority_boundary })) {
    reasons.push(
      "perspective_apply_review_authority_boundary_not_preview_only",
    );
  }
  return reasons;
}

function validateReviewBoundToContract({
  contract,
  review,
}: {
  contract: ResearchCandidateManualGlobalDogfoodPerspectiveApplyContract;
  review: ResearchCandidateManualGlobalDogfoodPerspectiveApplyReview;
}) {
  const reasons: string[] = [];
  if (
    review.source_contract_fingerprint !==
    contract.validation.contract_fingerprint
  ) {
    reasons.push("perspective_apply_review_contract_mismatch");
  }
  const summary = review.accepted_mapping_summary;
  if (!summary) {
    reasons.push("perspective_apply_review_source_mismatch");
    return uniqueStrings(reasons);
  }
  const mapping = contract.proposed_perspective_apply_mapping;
  const summaryMismatches = [
    summary.source_contract_fingerprint !== contract.validation.contract_fingerprint,
    summary.source_canonical_perspective_update_receipt_id !==
      contract.source_canonical_perspective_update_receipt_id,
    summary.source_canonical_perspective_update_record_id !==
      contract.source_canonical_perspective_update_record_id,
    summary.source_canonical_perspective_update_record_fingerprint !==
      contract.source_canonical_perspective_update_record_fingerprint,
    summary.source_perspective_relay_receipt_id !==
      contract.source_perspective_relay_receipt_id,
    summary.source_perspective_relay_record_id !==
      contract.source_perspective_relay_record_id,
    summary.source_perspective_relay_record_fingerprint !==
      contract.source_perspective_relay_record_fingerprint,
    summary.source_next_work_signal_receipt_id !==
      contract.source_next_work_signal_receipt_id,
    summary.source_next_work_signal_record_id !==
      contract.source_next_work_signal_record_id,
    summary.source_next_work_signal_record_fingerprint !==
      contract.source_next_work_signal_record_fingerprint,
    summary.source_next_work_bias_receipt_id !==
      contract.source_next_work_bias_receipt_id,
    summary.source_next_work_bias_record_id !==
      contract.source_next_work_bias_record_id,
    summary.source_next_work_bias_record_fingerprint !==
      contract.source_next_work_bias_record_fingerprint,
    summary.source_projection_fingerprint !== contract.source_projection_fingerprint,
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
    summary.intended_future_apply_target !==
      mapping.intended_future_apply_target,
    summary.apply_label !== mapping.apply_label,
    summary.apply_rationale !== mapping.apply_rationale,
    summary.canonical_update_label !== mapping.canonical_update_label,
    summary.canonical_update_rationale !== mapping.canonical_update_rationale,
    summary.future_write_mode !== contract.requested_future_write_mode,
    summary.writes_now !== false,
  ];
  if (summaryMismatches.some(Boolean)) {
    reasons.push("perspective_apply_review_source_mismatch");
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
    reasons.push(
      "perspective_apply_operator_authorization_shape_invalid",
    );
  }
  if (
    operatorAuthorization.authorization_kind !==
    "manual_operator_authorized_perspective_apply_write"
  ) {
    reasons.push("operator_authorization_kind_invalid");
  }
  if (
    operatorAuthorization.operator_confirmation_text !==
    RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_APPLY_WRITE_CONFIRMATION
  ) {
    reasons.push("perspective_apply_wrong_confirmation");
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
  db: PerspectiveApplyDbLike;
  request: ResearchCandidateManualGlobalDogfoodPerspectiveApplyWriteRequest;
  ignoreRequestSuppliedReadbacks?: boolean;
}) {
  const reasons: string[] = [];
  const contract = request.perspective_apply_contract;
  const canonicalUpdate =
    readResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateByReceiptId(
      contract.source_canonical_perspective_update_receipt_id!,
      { scope: contract.scope, db },
    );
  const canonicalUpdateReadback =
    readResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdate({
      scope: contract.scope,
      receiptId: contract.source_canonical_perspective_update_receipt_id,
      limit: 1,
      db,
    });
  if (!canonicalUpdate) {
    reasons.push("perspective_apply_source_canonical_update_receipt_not_active_committed");
    return reasons;
  }
  if (canonicalUpdate.receipt.write_status !== "committed") {
    reasons.push("perspective_apply_source_canonical_update_receipt_not_active_committed");
  }
  if (!canonicalUpdate.canonical_perspective_update_record) {
    reasons.push("perspective_apply_source_canonical_update_record_mismatch");
    return reasons;
  }
  if (!sourceCanonicalUpdateReadbackFlagsAreClean(canonicalUpdateReadback)) {
    reasons.push("perspective_apply_source_readback_forbidden_mutation_flag");
  }
  if (
    !ignoreRequestSuppliedReadbacks &&
    request.source_canonical_perspective_update_readback &&
    !sourceCanonicalUpdateReadbackFlagsAreClean(
      request.source_canonical_perspective_update_readback,
    )
  ) {
    reasons.push("perspective_apply_source_readback_forbidden_mutation_flag");
  }
  if (canonicalUpdateRecordMismatchesContract({ canonicalUpdate, contract })) {
    reasons.push("perspective_apply_source_canonical_update_record_mismatch");
  }
  return uniqueStrings(reasons);
}

function getSourceCanonicalUpdateForRequest({
  db,
  request,
}: {
  db: PerspectiveApplyDbLike;
  request: ResearchCandidateManualGlobalDogfoodPerspectiveApplyWriteRequest;
}) {
  const receiptId =
    request.perspective_apply_contract
      .source_canonical_perspective_update_receipt_id ?? null;
  if (!receiptId) return null;
  return readResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateByReceiptId(
    receiptId,
    { scope: request.perspective_apply_contract.scope, db },
  );
}

function canonicalUpdateRecordMismatchesContract({
  canonicalUpdate,
  contract,
}: {
  canonicalUpdate: NonNullable<
    ReturnType<typeof readResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateByReceiptId>
  >;
  contract: ResearchCandidateManualGlobalDogfoodPerspectiveApplyContract;
}) {
  const record = canonicalUpdate.canonical_perspective_update_record;
  const mapping = contract.proposed_perspective_apply_mapping;
  return (
    !record ||
    canonicalUpdate.receipt.receipt_id !==
      contract.source_canonical_perspective_update_receipt_id ||
    record.canonical_perspective_update_record_id !==
      contract.source_canonical_perspective_update_record_id ||
    record.canonical_perspective_update_record_fingerprint !==
      contract.source_canonical_perspective_update_record_fingerprint ||
    canonicalUpdate.receipt.source_perspective_relay_receipt_id !==
      contract.source_perspective_relay_receipt_id ||
    canonicalUpdate.receipt.source_perspective_relay_record_id !==
      contract.source_perspective_relay_record_id ||
    canonicalUpdate.receipt.source_perspective_relay_record_fingerprint !==
      contract.source_perspective_relay_record_fingerprint ||
    canonicalUpdate.receipt.source_next_work_signal_receipt_id !==
      contract.source_next_work_signal_receipt_id ||
    canonicalUpdate.receipt.source_next_work_signal_record_id !==
      contract.source_next_work_signal_record_id ||
    canonicalUpdate.receipt.source_next_work_signal_record_fingerprint !==
      contract.source_next_work_signal_record_fingerprint ||
    canonicalUpdate.receipt.source_next_work_bias_receipt_id !==
      contract.source_next_work_bias_receipt_id ||
    canonicalUpdate.receipt.source_next_work_bias_record_id !==
      contract.source_next_work_bias_record_id ||
    canonicalUpdate.receipt.source_next_work_bias_record_fingerprint !==
      contract.source_next_work_bias_record_fingerprint ||
    canonicalUpdate.receipt.source_projection_fingerprint !==
      contract.source_projection_fingerprint ||
    canonicalUpdate.receipt.source_global_dogfood_ledger_receipt_id !==
      contract.source_global_dogfood_ledger_receipt_id ||
    canonicalUpdate.receipt.source_global_dogfood_ledger_record_id !==
      contract.source_global_dogfood_ledger_record_id ||
    canonicalUpdate.receipt.source_metric_snapshot_receipt_id !==
      contract.source_metric_snapshot_receipt_id ||
    canonicalUpdate.receipt.source_metric_snapshot_record_id !==
      contract.source_metric_snapshot_record_id ||
    canonicalUpdate.receipt.source_manual_receipt_id !==
      contract.source_manual_receipt_id ||
    canonicalUpdate.receipt.source_handoff_seed_fingerprint !==
      contract.source_handoff_seed_fingerprint ||
    canonicalUpdate.receipt.source_result_text_fingerprint !==
      contract.source_result_text_fingerprint ||
    canonicalUpdate.receipt.source_expected_observed_delta_record_ref !==
      contract.source_expected_observed_delta_record_ref ||
    canonicalUpdate.receipt.source_reuse_outcome_record_ref !==
      contract.source_reuse_outcome_record_ref ||
    record.canonical_update_label !== mapping.canonical_update_label ||
    record.canonical_update_rationale !== mapping.canonical_update_rationale ||
    record.relay_update_label !== mapping.relay_update_label ||
    record.relay_update_rationale !== mapping.relay_update_rationale ||
    record.recommended_next_work_label !== mapping.recommended_next_work_label ||
    record.outcome_label !== mapping.outcome_label ||
    record.outcome_signal !== mapping.outcome_signal ||
    record.update_scope_hint !== "canonical_perspective_state" ||
    stableJson(record.selected_candidate_context_refs) !==
      stableJson(mapping.selected_candidate_context_refs) ||
    stableJson(record.source_next_work_candidate_card_ids) !==
      stableJson(mapping.source_next_work_candidate_card_ids) ||
    stableJson(record.manual_only_context_refs) !==
      stableJson(mapping.manual_only_context_refs)
  );
}

function sourceCanonicalUpdateReadbackFlagsAreClean(
  readback: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReadback,
) {
  return (
    readback.canonical_perspective_state_written === false &&
    readback.current_working_perspective_updated === false &&
    readback.perspective_promoted === false &&
    readback.perspective_memory_written === false &&
    readback.perspective_relay_mutated === false &&
    readback.next_work_bias_mutated === false &&
    readback.work_mutated === false &&
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
  db: PerspectiveApplyDbLike;
  request: ResearchCandidateManualGlobalDogfoodPerspectiveApplyWriteRequest;
}) {
  const supersedesReceiptId =
    request.operator_authorization.supersedes_receipt_id ?? "";
  const target =
    readResearchCandidateManualGlobalDogfoodPerspectiveApplyByReceiptId(
      supersedesReceiptId,
      { scope: request.perspective_apply_contract.scope, db },
    );
  if (!target) return "supersedes_receipt_id_not_found";
  if (target.receipt.write_status !== "committed") {
    return "supersedes_receipt_not_committed";
  }
  const update = db
    .prepare(
      `
        UPDATE research_candidate_manual_global_dogfood_perspective_apply_receipts
        SET write_status = 'superseded'
        WHERE receipt_id = ?
          AND scope = ?
          AND write_status = 'committed'
      `,
    )
    .run(supersedesReceiptId, request.perspective_apply_contract.scope);
  return getRunChangeCount(update) === 1
    ? null
    : "supersedes_receipt_not_committed";
}

function validateSupersedeTargetForRequest({
  db,
  request,
  existingReceipt,
}: {
  db: PerspectiveApplyDbLike;
  request: ResearchCandidateManualGlobalDogfoodPerspectiveApplyWriteRequest;
  existingReceipt: ResearchCandidateManualGlobalDogfoodPerspectiveApplyWriteReceipt | null;
}) {
  const supersedesReceiptId =
    request.operator_authorization.supersedes_receipt_id ?? "";
  const target =
    readResearchCandidateManualGlobalDogfoodPerspectiveApplyByReceiptId(
      supersedesReceiptId,
      { scope: request.perspective_apply_contract.scope, db },
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
  sourceCanonicalUpdate,
  idempotencyKey,
  createdAt,
}: {
  request: ResearchCandidateManualGlobalDogfoodPerspectiveApplyWriteRequest;
  sourceCanonicalUpdate: NonNullable<
    ReturnType<typeof readResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateByReceiptId>
  >;
  idempotencyKey: string;
  createdAt: string;
}): ResearchCandidateManualGlobalDogfoodPerspectiveApplyWriteReceipt {
  const contract = request.perspective_apply_contract;
  const source = {
    scope: contract.scope,
    source_perspective_apply_contract_fingerprint:
      contract.validation.contract_fingerprint,
    source_perspective_apply_review_fingerprint:
      request.perspective_apply_review.validation.review_fingerprint,
    source_canonical_perspective_update_receipt_id:
      sourceCanonicalUpdate.receipt.receipt_id,
    source_canonical_perspective_update_record_id:
      sourceCanonicalUpdate.canonical_perspective_update_record!
        .canonical_perspective_update_record_id,
    source_canonical_perspective_update_record_fingerprint:
      sourceCanonicalUpdate.canonical_perspective_update_record!
        .canonical_perspective_update_record_fingerprint,
    source_perspective_relay_receipt_id:
      sourceCanonicalUpdate.receipt.source_perspective_relay_receipt_id,
    source_perspective_relay_record_id:
      sourceCanonicalUpdate.receipt.source_perspective_relay_record_id,
    source_perspective_relay_record_fingerprint:
      sourceCanonicalUpdate.receipt.source_perspective_relay_record_fingerprint,
    source_next_work_signal_receipt_id:
      contract.source_next_work_signal_receipt_id!,
    source_next_work_signal_record_id:
      contract.source_next_work_signal_record_id!,
    source_next_work_signal_record_fingerprint:
      contract.source_next_work_signal_record_fingerprint!,
    source_next_work_bias_receipt_id: contract.source_next_work_bias_receipt_id!,
    source_next_work_bias_record_id: contract.source_next_work_bias_record_id!,
    source_next_work_bias_record_fingerprint:
      contract.source_next_work_bias_record_fingerprint!,
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
  const receiptId = `manual-global-dogfood-perspective-apply-receipt:${fingerprint({
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

function buildPerspectiveApplyRecord({
  request,
  sourceCanonicalUpdate,
  receipt,
  createdAt,
}: {
  request: ResearchCandidateManualGlobalDogfoodPerspectiveApplyWriteRequest;
  sourceCanonicalUpdate: NonNullable<
    ReturnType<typeof readResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateByReceiptId>
  >;
  receipt: ResearchCandidateManualGlobalDogfoodPerspectiveApplyWriteReceipt;
  createdAt: string;
}): ResearchCandidateManualGlobalDogfoodPerspectiveApplyRecord {
  const contract = request.perspective_apply_contract;
  const mapping = contract.proposed_perspective_apply_mapping;
  const candidate = contract.proposed_apply_candidate;
  const sourceRefs = uniqueStrings([
    contract.source_canonical_perspective_update_readback_ref,
    sourceCanonicalUpdate.receipt.receipt_id,
    sourceCanonicalUpdate.canonical_perspective_update_record
      ?.canonical_perspective_update_record_id,
    sourceCanonicalUpdate.canonical_perspective_update_record
      ?.canonical_perspective_update_record_fingerprint,
    contract.source_perspective_relay_receipt_id,
    contract.source_perspective_relay_record_id,
    contract.source_perspective_relay_record_fingerprint,
    contract.source_next_work_signal_receipt_id,
    contract.source_next_work_signal_record_id,
    contract.source_next_work_signal_record_fingerprint,
    contract.source_next_work_bias_receipt_id,
    contract.source_next_work_bias_record_id,
    contract.source_next_work_bias_record_fingerprint,
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
    request.perspective_apply_review.validation.review_fingerprint,
    ...mapping.source_next_work_candidate_card_ids,
    ...mapping.selected_candidate_context_refs,
    ...mapping.manual_only_context_refs,
  ]);
  const source = {
    receipt_id: receipt.receipt_id,
    scope: contract.scope,
    source_canonical_perspective_update_receipt_id:
      sourceCanonicalUpdate.receipt.receipt_id,
    source_canonical_perspective_update_record_id:
      sourceCanonicalUpdate.canonical_perspective_update_record!
        .canonical_perspective_update_record_id,
    source_perspective_relay_receipt_id:
      contract.source_perspective_relay_receipt_id!,
    source_perspective_relay_record_id:
      contract.source_perspective_relay_record_id!,
    source_next_work_signal_receipt_id:
      contract.source_next_work_signal_receipt_id!,
    source_next_work_signal_record_id:
      contract.source_next_work_signal_record_id!,
    source_next_work_bias_receipt_id: contract.source_next_work_bias_receipt_id!,
    source_next_work_bias_record_id: contract.source_next_work_bias_record_id!,
    source_projection_fingerprint: contract.source_projection_fingerprint!,
    source_global_dogfood_ledger_receipt_id:
      contract.source_global_dogfood_ledger_receipt_id!,
    source_global_dogfood_ledger_record_id:
      contract.source_global_dogfood_ledger_record_id!,
    source_metric_snapshot_receipt_id:
      contract.source_metric_snapshot_receipt_id!,
    source_metric_snapshot_record_id: contract.source_metric_snapshot_record_id!,
    apply_label: mapping.apply_label!,
    apply_rationale: mapping.apply_rationale!,
    canonical_update_label: mapping.canonical_update_label!,
    canonical_update_rationale: mapping.canonical_update_rationale!,
    relay_update_label: mapping.relay_update_label!,
    relay_update_rationale: mapping.relay_update_rationale!,
    recommended_next_work_label: mapping.recommended_next_work_label!,
    outcome_label: mapping.outcome_label!,
    outcome_signal: mapping.outcome_signal!,
    intended_future_apply_target: "canonical_perspective_state" as const,
    apply_scope_hint: "canonical_perspective_state" as const,
    apply_strength_hint: candidate.apply_strength_hint as "low" | "medium" | "high",
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
    compatibility_findings: contract.compatibility_findings.map(
      (finding) => finding.finding_code,
    ),
    existing_apply_path_compatibility:
      contract.proposed_existing_apply_path_compatibility as unknown as Record<
        string,
        unknown
      >,
    source_refs: sourceRefs,
  };
  const recordId = `manual-global-dogfood-perspective-apply-record:${fingerprint({
    ...source,
    created_at: createdAt,
  })}`;
  return {
    perspective_apply_record_id: recordId,
    created_at: createdAt,
    ...source,
    outcome_signal: source.outcome_signal as "positive" | "negative" | "ambiguous",
    authority_profile: AUTHORITY_PROFILE,
    perspective_apply_record_fingerprint: fingerprint({
      ...source,
      perspective_apply_record_id: recordId,
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
}): ResearchCandidateManualGlobalDogfoodPerspectiveApplyRollbackRecord {
  const rollbackId = `manual-global-dogfood-perspective-apply-rollback:${fingerprint({
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
  db: PerspectiveApplyDbLike,
  receipt: ResearchCandidateManualGlobalDogfoodPerspectiveApplyWriteReceipt,
) {
  db.prepare(
    `
      INSERT INTO research_candidate_manual_global_dogfood_perspective_apply_receipts (
        receipt_id,
        created_at,
        scope,
        source_perspective_apply_contract_fingerprint,
        source_perspective_apply_review_fingerprint,
        source_canonical_perspective_update_receipt_id,
        source_canonical_perspective_update_record_id,
        source_canonical_perspective_update_record_fingerprint,
        source_perspective_relay_receipt_id,
        source_perspective_relay_record_id,
        source_perspective_relay_record_fingerprint,
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
        @source_perspective_apply_contract_fingerprint,
        @source_perspective_apply_review_fingerprint,
        @source_canonical_perspective_update_receipt_id,
        @source_canonical_perspective_update_record_id,
        @source_canonical_perspective_update_record_fingerprint,
        @source_perspective_relay_receipt_id,
        @source_perspective_relay_record_id,
        @source_perspective_relay_record_fingerprint,
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

function insertPerspectiveApplyRecord(
  db: PerspectiveApplyDbLike,
  record: ResearchCandidateManualGlobalDogfoodPerspectiveApplyRecord,
) {
  db.prepare(
    `
      INSERT INTO research_candidate_manual_global_dogfood_perspective_apply_records (
        perspective_apply_record_id,
        receipt_id,
        created_at,
        scope,
        source_canonical_perspective_update_receipt_id,
        source_canonical_perspective_update_record_id,
        source_perspective_relay_receipt_id,
        source_perspective_relay_record_id,
        source_next_work_signal_receipt_id,
        source_next_work_signal_record_id,
        source_next_work_bias_receipt_id,
        source_next_work_bias_record_id,
        source_projection_fingerprint,
        source_global_dogfood_ledger_receipt_id,
        source_global_dogfood_ledger_record_id,
        source_metric_snapshot_receipt_id,
        source_metric_snapshot_record_id,
        apply_label,
        apply_rationale,
        canonical_update_label,
        canonical_update_rationale,
        relay_update_label,
        relay_update_rationale,
        recommended_next_work_label,
        outcome_label,
        outcome_signal,
        intended_future_apply_target,
        apply_scope_hint,
        apply_strength_hint,
        expected_summary,
        observed_summary,
        mismatch_or_gap_summary,
        selected_candidate_context_refs_json,
        source_next_work_candidate_card_ids_json,
        manual_only_context_refs_json,
        source_line,
        blockers_json,
        warnings_json,
        compatibility_findings_json,
        existing_apply_path_compatibility_json,
        source_refs_json,
        authority_profile,
        perspective_apply_record_fingerprint
      )
      VALUES (
        @perspective_apply_record_id,
        @receipt_id,
        @created_at,
        @scope,
        @source_canonical_perspective_update_receipt_id,
        @source_canonical_perspective_update_record_id,
        @source_perspective_relay_receipt_id,
        @source_perspective_relay_record_id,
        @source_next_work_signal_receipt_id,
        @source_next_work_signal_record_id,
        @source_next_work_bias_receipt_id,
        @source_next_work_bias_record_id,
        @source_projection_fingerprint,
        @source_global_dogfood_ledger_receipt_id,
        @source_global_dogfood_ledger_record_id,
        @source_metric_snapshot_receipt_id,
        @source_metric_snapshot_record_id,
        @apply_label,
        @apply_rationale,
        @canonical_update_label,
        @canonical_update_rationale,
        @relay_update_label,
        @relay_update_rationale,
        @recommended_next_work_label,
        @outcome_label,
        @outcome_signal,
        @intended_future_apply_target,
        @apply_scope_hint,
        @apply_strength_hint,
        @expected_summary,
        @observed_summary,
        @mismatch_or_gap_summary,
        @selected_candidate_context_refs_json,
        @source_next_work_candidate_card_ids_json,
        @manual_only_context_refs_json,
        @source_line,
        @blockers_json,
        @warnings_json,
        @compatibility_findings_json,
        @existing_apply_path_compatibility_json,
        @source_refs_json,
        @authority_profile,
        @perspective_apply_record_fingerprint
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
    compatibility_findings_json: JSON.stringify(record.compatibility_findings),
    existing_apply_path_compatibility_json: JSON.stringify(
      record.existing_apply_path_compatibility,
    ),
    source_refs_json: JSON.stringify(record.source_refs),
  });
}

function insertRollback(
  db: PerspectiveApplyDbLike,
  rollback: ResearchCandidateManualGlobalDogfoodPerspectiveApplyRollbackRecord,
) {
  db.prepare(
    `
      INSERT INTO research_candidate_manual_global_dogfood_perspective_apply_rollbacks (
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
  validation: ResearchCandidateManualGlobalDogfoodPerspectiveApplyWriteValidation;
  readback: ReturnType<
    typeof readResearchCandidateManualGlobalDogfoodPerspectiveApply
  >;
}): ResearchCandidateManualGlobalDogfoodPerspectiveApplyWriteResult {
  const existing = readback.records_by_receipt[0];
  return {
    ok: true,
    result_status: "duplicate_replayed",
    validation,
    receipt: existing?.receipt ?? null,
    perspective_apply_record:
      existing?.perspective_apply_record ?? null,
    readback,
    refusal_reasons: [],
    duplicate_replayed: true,
    idempotency_key: validation.idempotency_key,
    authority_boundary:
      getResearchCandidateManualGlobalDogfoodPerspectiveApplyWriteAuthorityBoundary(),
    ...writeResultFlags(Boolean(existing)),
  };
}

function refusedResult({
  validation,
  idempotencyKey,
}: {
  validation: ResearchCandidateManualGlobalDogfoodPerspectiveApplyWriteValidation;
  idempotencyKey: string | null;
}): ResearchCandidateManualGlobalDogfoodPerspectiveApplyWriteResult {
  return {
    ok: false,
    result_status: "refused",
    validation,
    receipt: null,
    perspective_apply_record: null,
    readback: null,
    refusal_reasons: validation.failure_codes,
    duplicate_replayed: false,
    idempotency_key: idempotencyKey,
    authority_boundary:
      getResearchCandidateManualGlobalDogfoodPerspectiveApplyWriteAuthorityBoundary(),
    ...writeResultFlags(false),
  };
}

function rollbackRefused(
  refusalReasons: string[],
): ResearchCandidateManualGlobalDogfoodPerspectiveApplyRollbackResult {
  return {
    ok: false,
    result_status: "refused",
    rollback: null,
    receipt: null,
    readback: null,
    refusal_reasons: uniqueStrings(refusalReasons),
    authority_boundary:
      getResearchCandidateManualGlobalDogfoodPerspectiveApplyWriteAuthorityBoundary(),
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
}): ResearchCandidateManualGlobalDogfoodPerspectiveApplyWriteValidation {
  const uniqueFailureCodes = uniqueStrings(failureCodes);
  const contractRecord = isRecord(request?.perspective_apply_contract)
    ? request.perspective_apply_contract
    : null;
  const mapping = isRecord(
    contractRecord?.proposed_perspective_apply_mapping,
  )
    ? contractRecord.proposed_perspective_apply_mapping
    : null;
  const candidate = isRecord(contractRecord?.proposed_apply_candidate)
    ? contractRecord.proposed_apply_candidate
    : null;
  return {
    passed: uniqueFailureCodes.length === 0,
    failure_codes: uniqueFailureCodes,
    idempotency_key: idempotencyKey,
    exact_operator_confirmation_present:
      isRecord(request?.operator_authorization) &&
      request?.operator_authorization.operator_confirmation_text ===
        RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_APPLY_WRITE_CONFIRMATION,
    ready_perspective_apply_contract_present:
      isRecord(contractRecord) &&
      contractRecord.operator_authorization_mode ===
        "ready_for_future_perspective_apply_write_authorization",
    accepted_perspective_apply_review_present:
      isRecord(request?.perspective_apply_review) &&
      request?.perspective_apply_review.review_status ===
        "ready_for_future_perspective_apply_write_slice",
    preview_contract_remained_non_writing:
      isRecord(contractRecord) &&
      contractNonWriteConfirmationStillClean(
        contractRecord as unknown as ResearchCandidateManualGlobalDogfoodPerspectiveApplyContract,
      ),
    preview_authority_boundary_was_read_only:
      isRecord(contractRecord) &&
      contractAuthorityBoundaryStillReadOnly(
        contractRecord as unknown as Pick<
          ResearchCandidateManualGlobalDogfoodPerspectiveApplyContract,
          "authority_boundary"
        >,
      ),
    writer_authority_boundary_is_narrow: writerAuthorityBoundaryIsNarrow(),
    raw_text_fields_absent: !containsRawTextField(request),
    operator_note_absent: !containsOperatorNoteField(request),
    source_refs_present:
      isRecord(contractRecord) &&
      sourceRefsPresent(
        contractRecord as unknown as ResearchCandidateManualGlobalDogfoodPerspectiveApplyContract,
      ),
    source_canonical_perspective_update_receipt_active_committed:
      !uniqueFailureCodes.includes(
        "perspective_apply_source_canonical_update_receipt_not_active_committed",
      ),
    source_canonical_perspective_update_record_matches_contract:
      !uniqueFailureCodes.includes(
        "perspective_apply_source_canonical_update_record_mismatch",
      ),
    source_readback_flags_preserve_no_forbidden_mutation:
      !uniqueFailureCodes.includes(
        "perspective_apply_source_readback_forbidden_mutation_flag",
      ),
    apply_label_present:
      isRecord(mapping) && hasText(mapping.apply_label),
    apply_rationale_present:
      isRecord(mapping) && hasText(mapping.apply_rationale),
    canonical_update_label_present:
      isRecord(mapping) && hasText(mapping.canonical_update_label),
    canonical_update_rationale_present:
      isRecord(mapping) && hasText(mapping.canonical_update_rationale),
    relay_update_label_present:
      isRecord(mapping) && hasText(mapping.relay_update_label),
    relay_update_rationale_present:
      isRecord(mapping) && hasText(mapping.relay_update_rationale),
    selected_candidate_context_refs_present:
      isRecord(mapping) &&
      Array.isArray(mapping.selected_candidate_context_refs) &&
      mapping.selected_candidate_context_refs.length > 0,
    source_next_work_candidate_card_ids_present:
      isRecord(mapping) &&
      Array.isArray(mapping.source_next_work_candidate_card_ids) &&
      mapping.source_next_work_candidate_card_ids.length > 0,
    apply_scope_hint_is_canonical_perspective_state:
      isRecord(candidate) &&
      candidate.apply_scope_hint === "canonical_perspective_state",
    intended_future_apply_target_is_canonical_perspective_state:
      isRecord(mapping) &&
      mapping.intended_future_apply_target === "canonical_perspective_state",
    proposed_perspective_apply_candidate_ready:
      isRecord(candidate) &&
      candidate.candidate_status ===
        "ready_for_future_perspective_apply_write_authorization",
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
    "manual_operator_authorized_perspective_apply_rollback"
  ) {
    reasons.push("rollback_authorization_kind_invalid");
  }
  if (
    authorization.operator_confirmation_text !==
    RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_APPLY_ROLLBACK_CONFIRMATION
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

function computePerspectiveApplyIdempotencyKey(
  contract: ResearchCandidateManualGlobalDogfoodPerspectiveApplyContract,
) {
  const mapping = contract.proposed_perspective_apply_mapping;
  const candidate = contract.proposed_apply_candidate;
  return `manual-global-dogfood-perspective-apply:${fingerprint({
    write_version:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_APPLY_WRITE_VERSION,
    perspective_apply_contract_fingerprint:
      contract.validation.contract_fingerprint,
    source_canonical_perspective_update_receipt_id:
      contract.source_canonical_perspective_update_receipt_id,
    source_canonical_perspective_update_record_id:
      contract.source_canonical_perspective_update_record_id,
    source_canonical_perspective_update_record_fingerprint:
      contract.source_canonical_perspective_update_record_fingerprint,
    source_perspective_relay_receipt_id:
      contract.source_perspective_relay_receipt_id,
    source_perspective_relay_record_id:
      contract.source_perspective_relay_record_id,
    source_perspective_relay_record_fingerprint:
      contract.source_perspective_relay_record_fingerprint,
    source_next_work_signal_receipt_id:
      contract.source_next_work_signal_receipt_id,
    source_next_work_signal_record_id:
      contract.source_next_work_signal_record_id,
    source_next_work_signal_record_fingerprint:
      contract.source_next_work_signal_record_fingerprint,
    source_next_work_bias_receipt_id: contract.source_next_work_bias_receipt_id,
    source_next_work_bias_record_id: contract.source_next_work_bias_record_id,
    source_next_work_bias_record_fingerprint:
      contract.source_next_work_bias_record_fingerprint,
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
    apply_label: mapping.apply_label,
    apply_rationale: mapping.apply_rationale,
    canonical_update_label: mapping.canonical_update_label,
    canonical_update_rationale: mapping.canonical_update_rationale,
    relay_update_label: mapping.relay_update_label,
    relay_update_rationale: mapping.relay_update_rationale,
    intended_future_apply_target: mapping.intended_future_apply_target,
    recommended_next_work_label: mapping.recommended_next_work_label,
    outcome_label: mapping.outcome_label,
    outcome_signal: mapping.outcome_signal,
    apply_scope_hint: candidate.apply_scope_hint,
    apply_strength_hint: candidate.apply_strength_hint,
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
  validation: ResearchCandidateManualGlobalDogfoodPerspectiveApplyWriteValidation,
  failures: string[],
): ResearchCandidateManualGlobalDogfoodPerspectiveApplyWriteValidation {
  return validationResult({
    failureCodes: [...validation.failure_codes, ...failures],
    idempotencyKey: validation.idempotency_key,
    request: null,
  });
}

function contractNonWriteConfirmationStillClean(
  contract: Pick<
    ResearchCandidateManualGlobalDogfoodPerspectiveApplyContract,
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
    ResearchCandidateManualGlobalDogfoodPerspectiveApplyContract,
    "authority_boundary"
  >,
) {
  const boundary = contract.authority_boundary;
  if (!isRecord(boundary)) return false;
  return (
    boundary.preview_only === true &&
    boundary.read_only === true &&
    boundary.can_write_canonical_perspective_state === false &&
    boundary.can_update_current_working_perspective === false &&
    boundary.can_promote_perspective === false &&
    boundary.can_write_perspective_memory === false &&
    boundary.can_mutate_canonical_perspective_update_record === false &&
    boundary.can_mutate_perspective_relay === false &&
    boundary.can_mutate_next_work_bias === false &&
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
    getResearchCandidateManualGlobalDogfoodPerspectiveApplyWriteAuthorityBoundary();
  return (
    boundary.can_write_perspective_apply_record === true &&
    boundary.can_write_perspective_apply_receipt === true &&
    boundary.can_write_perspective_apply_rollback_metadata === true &&
    boundary.can_write_canonical_perspective_state === false &&
    boundary.can_update_current_working_perspective === false &&
    boundary.can_promote_perspective === false &&
    boundary.can_write_perspective_memory === false &&
    boundary.can_mutate_canonical_perspective_update_record === false &&
    boundary.can_write_perspective_relay === false &&
    boundary.can_mutate_perspective_relay === false &&
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
  contract: ResearchCandidateManualGlobalDogfoodPerspectiveApplyContract,
) {
  return [
    contract.source_canonical_perspective_update_receipt_id,
    contract.source_canonical_perspective_update_record_id,
    contract.source_canonical_perspective_update_record_fingerprint,
    contract.source_perspective_relay_receipt_id,
    contract.source_perspective_relay_record_id,
    contract.source_perspective_relay_record_fingerprint,
    contract.source_next_work_signal_receipt_id,
    contract.source_next_work_signal_record_id,
    contract.source_next_work_signal_record_fingerprint,
    contract.source_next_work_bias_receipt_id,
    contract.source_next_work_bias_record_id,
    contract.source_next_work_bias_record_fingerprint,
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
    .map(
      ([key]) =>
        `perspective_apply_requested_side_effects_refused:${key}`,
    );
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

function writeResultFlags(hasPerspectiveApplyRows: boolean) {
  return {
    perspective_apply_record_written: hasPerspectiveApplyRows,
    current_working_perspective_updated: false,
    canonical_perspective_state_written: false,
    perspective_promoted: false,
    perspective_memory_written: false,
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

function rollbackWriteTransaction(db: PerspectiveApplyDbLike) {
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
