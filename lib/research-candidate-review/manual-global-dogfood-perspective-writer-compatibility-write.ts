import { openDatabase } from "@/lib/db";
import {
  ensureResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilitySchema,
  getResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityWriteAuthorityBoundary,
  readResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibility,
  readResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityByReceiptId,
  type ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityDbLike,
} from "@/lib/research-candidate-review/read-manual-global-dogfood-perspective-writer-compatibility";
import {
  ensureResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationSchema,
  readResearchCandidateManualGlobalDogfoodPerspectiveStateApplication,
  readResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationByReceiptId,
} from "@/lib/research-candidate-review/read-manual-global-dogfood-perspective-state-application";
import type {
  ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityContract,
} from "@/types/research-candidate-manual-global-dogfood-perspective-writer-compatibility-contract";
import {
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_WRITER_COMPATIBILITY_ROLLBACK_CONFIRMATION,
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_WRITER_COMPATIBILITY_WRITE_CONFIRMATION,
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_WRITER_COMPATIBILITY_WRITE_VERSION,
  type ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityRecord,
  type ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityRollbackRecord,
  type ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityRollbackResult,
  type ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityWriteReceipt,
  type ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityWriteRequest,
  type ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityWriteResult,
  type ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityWriteValidation,
} from "@/types/research-candidate-manual-global-dogfood-perspective-writer-compatibility-write";
import type {
  ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityReview,
} from "@/types/research-candidate-manual-global-dogfood-perspective-writer-compatibility-review";
import type {
  ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationReadback,
} from "@/types/research-candidate-manual-global-dogfood-perspective-state-application-write";

type PerspectiveWriterCompatibilityDbLike =
  ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityDbLike;
type JsonRecord = Record<string, unknown>;

const FINGERPRINT_ALGORITHM = "fnv1a32_canonical_json_v0_1" as const;
const AUTHORITY_PROFILE =
  "manual_global_dogfood_perspective_writer_compatibility_write_authority.v0.1";
const SUPPORTED_OUTCOME_SIGNALS = new Set(["positive", "negative", "ambiguous"]);
const SUPPORTED_WRITER_COMPATIBILITY_TARGETS = new Set([
  "manual_specific_existing_canonical_state_writer_adapter",
  "manual_specific_current_working_writer_adapter",
]);
const FORBIDDEN_WRITER_COMPATIBILITY_TARGETS = new Set([
  "existing_current_working_perspective_writer",
  "existing_canonical_perspective_state_writer",
]);
const SUPPORTED_WRITER_COMPATIBILITY_STRENGTHS = new Set([
  "low",
  "medium",
  "high",
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
  /current.*working.*perspective/i,
  /existing.*current.*working.*writer/i,
  /existing.*canonical.*state.*writer/i,
  /existing.*canonical.*perspective.*state/i,
  /canonical.*perspective.*(state|write|mutate)/i,
  /perspective.*(promotion|promote|memory|state.*mutation.*mutate|apply.*mutate|relay.*mutate)/i,
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

export function writeResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibility(
  request: unknown,
  options: { db?: PerspectiveWriterCompatibilityDbLike } = {},
): ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityWriteResult {
  const validation =
    validateResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityWriteRequest(
      request,
    );
  if (!validation.passed || !isRecord(request)) {
    return refusedResult({ validation, idempotencyKey: validation.idempotency_key });
  }

  const typedRequest =
    request as unknown as ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityWriteRequest;
  const contract = typedRequest.perspective_writer_compatibility_contract;
  const db =
    options.db ?? (openDatabase() as unknown as PerspectiveWriterCompatibilityDbLike);
  const ownsDb = !options.db;

  try {
    ensureResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationSchema(db);
    ensureResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilitySchema(db);

    const earlySourceFailures = validateSourcesForRequest({ db, request: typedRequest });
    if (earlySourceFailures.length > 0) {
      return refusedResult({
        validation: validationWithFailures(validation, earlySourceFailures),
        idempotencyKey: validation.idempotency_key,
      });
    }

    const sourceStateApplication = getSourceStateApplicationForRequest({
      db,
      request: typedRequest,
    });
    const createdAt = new Date().toISOString();
    const receipt = buildReceipt({
      request: typedRequest,
      sourceStateApplication: sourceStateApplication!,
      idempotencyKey: validation.idempotency_key!,
      createdAt,
    });
    const writer_compatibilityRecord = buildPerspectiveWriterCompatibilityRecord({
      request: typedRequest,
      sourceStateApplication: sourceStateApplication!,
      receipt,
      createdAt,
    });

    let transactionStarted = false;
    try {
      db.prepare("BEGIN IMMEDIATE").run();
      transactionStarted = true;

      const existingReadback =
        readResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibility({
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
      insertPerspectiveWriterCompatibilityRecord(db, writer_compatibilityRecord);
      db.prepare("COMMIT").run();
      transactionStarted = false;
    } catch {
      if (transactionStarted) rollbackWriteTransaction(db);
      const duplicateReadback =
        readResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibility({
          scope: contract.scope,
          idempotencyKey: validation.idempotency_key,
          limit: 1,
          db,
        });
      if (duplicateReadback.records_by_receipt[0]) {
        return duplicateReplayResult({ validation, readback: duplicateReadback });
      }
      return refusedResult({
        validation: validationWithFailures(validation, ["sqlite_transaction_failed"]),
        idempotencyKey: validation.idempotency_key,
      });
    }

    return {
      ok: true,
      result_status: "committed",
      validation,
      receipt,
      perspective_writer_compatibility_record: writer_compatibilityRecord,
      readback: readResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibility({
        scope: contract.scope,
        receiptId: receipt.receipt_id,
        limit: 1,
        db,
      }),
      refusal_reasons: [],
      duplicate_replayed: false,
      idempotency_key: validation.idempotency_key,
      authority_boundary:
        getResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityWriteAuthorityBoundary(),
      ...writeResultFlags(true),
    };
  } finally {
    if (ownsDb && "close" in db && typeof db.close === "function") {
      db.close();
    }
  }
}

export function rollbackResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityReceipt(
  request: unknown,
  options: { db?: PerspectiveWriterCompatibilityDbLike } = {},
): ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityRollbackResult {
  const validation = validateRollbackRequest(request);
  const db =
    options.db ?? (openDatabase() as unknown as PerspectiveWriterCompatibilityDbLike);
  const ownsDb = !options.db;
  try {
    ensureResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilitySchema(db);
    if (!validation.ok) {
      return rollbackRefused({
        refusalReasons: validation.reasons,
        readback: readResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibility({ db }),
      });
    }
    const receiptId = (request as JsonRecord).receipt_id as string;
    const rollbackReason = ((request as JsonRecord).rollback_authorization as JsonRecord)
      .rollback_reason as string;
    const existing = readResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityByReceiptId(
      receiptId,
      { db },
    );
    if (!existing) {
      return rollbackRefused({
        resultStatus: "not_found",
        refusalReasons: ["perspective_writer_compatibility_receipt_not_found"],
        readback: readResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibility({ db }),
      });
    }
    if (existing.receipt.write_status === "rolled_back") {
      return {
        ok: true,
        result_status: "rolled_back",
        rollback: existing.rollback,
        receipt: existing.receipt,
        readback: readResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibility({
          receiptId,
          db,
        }),
        refusal_reasons: [],
        authority_boundary:
          getResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityWriteAuthorityBoundary(),
        ...rollbackResultFlags(Boolean(existing.perspective_writer_compatibility_record)),
      };
    }
    if (existing.receipt.write_status !== "committed") {
      return rollbackRefused({
        refusalReasons: ["perspective_writer_compatibility_receipt_not_committed"],
        readback: readResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibility({
          receiptId,
          db,
        }),
      });
    }

    const rollbackRecord = buildRollbackRecord({
      receiptId,
      rollbackReason,
      createdAt: new Date().toISOString(),
    });

    let transactionStarted = false;
    try {
      db.prepare("BEGIN IMMEDIATE").run();
      transactionStarted = true;
      const update = db
        .prepare(
          `
            UPDATE research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts
            SET write_status = 'rolled_back',
                rollback_reason = ?,
                rollback_of_receipt_id = ?
            WHERE receipt_id = ?
              AND write_status = 'committed'
          `,
        )
        .run(rollbackReason, receiptId, receiptId);
      if (getRunChangeCount(update) !== 1) {
        rollbackWriteTransaction(db);
        transactionStarted = false;
        return rollbackRefused({
          refusalReasons: ["perspective_writer_compatibility_receipt_not_committed"],
          readback: readResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibility({
            receiptId,
            db,
          }),
        });
      }
      insertRollback(db, rollbackRecord);
      db.prepare("COMMIT").run();
      transactionStarted = false;
    } catch {
      if (transactionStarted) rollbackWriteTransaction(db);
      const replay = readResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityByReceiptId(
        receiptId,
        { db },
      );
      if (replay?.receipt.write_status === "rolled_back") {
        return {
          ok: true,
          result_status: "rolled_back",
          rollback: replay.rollback,
          receipt: replay.receipt,
          readback: readResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibility({
            receiptId,
            db,
          }),
          refusal_reasons: [],
          authority_boundary:
            getResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityWriteAuthorityBoundary(),
          ...rollbackResultFlags(Boolean(replay.perspective_writer_compatibility_record)),
        };
      }
      return rollbackRefused({
        refusalReasons: ["sqlite_transaction_failed"],
        readback: readResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibility({
          receiptId,
          db,
        }),
      });
    }

    const readback = readResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibility({
      receiptId,
      db,
    });
    const rolledBack = readback.records_by_receipt[0] ?? null;
    return {
      ok: true,
      result_status: "rolled_back",
      rollback: rolledBack?.rollback ?? rollbackRecord,
      receipt: rolledBack?.receipt ?? existing.receipt,
      readback,
      refusal_reasons: [],
      authority_boundary:
        getResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityWriteAuthorityBoundary(),
      ...rollbackResultFlags(Boolean(rolledBack?.perspective_writer_compatibility_record)),
    };
  } finally {
    if (ownsDb && "close" in db && typeof db.close === "function") {
      db.close();
    }
  }
}

export function validateResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityWriteRequest(
  request: unknown,
): ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityWriteValidation {
  const reasons: string[] = [];
  if (!isRecord(request)) {
    reasons.push("perspective_writer_compatibility_operator_authorization_shape_invalid");
    return buildValidation({ reasons, request, idempotencyKey: null });
  }

  const contractRecord = isRecord(request.perspective_writer_compatibility_contract)
    ? (request.perspective_writer_compatibility_contract as unknown as JsonRecord)
    : null;
  const contractShapeValid =
    contractRecord !== null && validateContractShape(contractRecord);
  const contract = contractShapeValid
    ? (contractRecord as unknown as ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityContract)
    : null;
  const review = isRecord(request.perspective_writer_compatibility_review)
    ? (request.perspective_writer_compatibility_review as unknown as ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityReview)
    : null;

  if (!contractShapeValid || !contract) {
    reasons.push("perspective_writer_compatibility_contract_shape_invalid");
  } else {
    reasons.push(...validateContract(contract));
  }

  if (!review || !validateReviewShape(review as unknown as JsonRecord)) {
    reasons.push("perspective_writer_compatibility_review_shape_invalid");
  } else if (contractShapeValid && contract) {
    reasons.push(...validateReview(review, contract));
  }

  if (!isRecord(request.operator_authorization)) {
    reasons.push("perspective_writer_compatibility_operator_authorization_shape_invalid");
  } else {
    reasons.push(...validateOperatorAuthorization(request.operator_authorization));
  }

  if (request.requested_side_effects !== undefined) {
    reasons.push(...validateRequestedSideEffects(request.requested_side_effects));
  }

  if (!rawTextFieldsAbsent(request)) {
    reasons.push("raw_text_fields_present");
  }
  if (!operatorNotesAbsentFromPersistedRequest(request)) {
    reasons.push("operator_notes_present");
  }

  const sourceReadback = isRecord(request.source_perspective_state_application_readback)
    ? (request.source_perspective_state_application_readback as unknown as ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationReadback)
    : null;
  if (sourceReadback && !sourceStateApplicationReadbackFlagsAreClean(sourceReadback)) {
    reasons.push("perspective_writer_compatibility_source_readback_forbidden_mutation_flag");
  }

  const idempotencyKey = contractShapeValid && contract
    ? computePerspectiveWriterCompatibilityIdempotencyKey(contract)
    : null;
  return buildValidation({ reasons, request, idempotencyKey });
}

function validateContractShape(contract: JsonRecord) {
  return (
    contract.contract_kind ===
      "research_candidate_manual_global_dogfood_perspective_writer_compatibility_contract" &&
    contract.contract_version ===
      "research_candidate_manual_global_dogfood_perspective_writer_compatibility_contract.v0.1" &&
    isRecord(contract.proposed_writer_compatibility_mapping) &&
    isRecord(contract.proposed_writer_compatibility_candidate) &&
    isRecord(contract.proposed_manual_writer_compatibility_path) &&
    isRecord(contract.idempotency_contract_preview) &&
    isRecord(contract.validation) &&
    isRecord(contract.authority_boundary)
  );
}

function validateContract(
  contract: ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityContract,
) {
  const reasons: string[] = [];
  const mapping = contract.proposed_writer_compatibility_mapping;
  const candidate = contract.proposed_writer_compatibility_candidate;
  const writePath = contract.proposed_manual_writer_compatibility_path;
  if (
    contract.operator_authorization_mode !==
      "ready_for_future_perspective_writer_compatibility_write_authorization" ||
    contract.validation.passed !== true ||
    contract.validation.blocker_count !== 0 ||
    contract.blocker_reasons.length > 0 ||
    candidate.candidate_status !==
      "ready_for_future_perspective_writer_compatibility_write_authorization"
  ) {
    reasons.push("perspective_writer_compatibility_contract_not_ready");
  }
  if (!sourceRefsPresent(contract)) reasons.push("source_refs_missing");
  if (!hasText(contract.source_handoff_seed_fingerprint)) {
    reasons.push("source_handoff_seed_fingerprint_missing");
  }
  if (!hasText(contract.source_result_text_fingerprint)) {
    reasons.push("source_result_text_fingerprint_missing");
  }
  if (!hasText(mapping.writer_compatibility_label)) reasons.push("writer_compatibility_label_missing");
  if (!hasText(mapping.writer_compatibility_rationale)) {
    reasons.push("writer_compatibility_rationale_missing");
  }
  if (!hasText(mapping.state_application_label)) reasons.push("state_application_label_missing");
  if (!hasText(mapping.state_application_rationale)) {
    reasons.push("state_application_rationale_missing");
  }
  if (!hasText(mapping.adapter_label)) reasons.push("adapter_label_missing");
  if (!hasText(mapping.adapter_rationale)) {
    reasons.push("adapter_rationale_missing");
  }
  if (!hasText(mapping.mutation_label)) reasons.push("mutation_label_missing");
  if (!hasText(mapping.mutation_rationale)) {
    reasons.push("mutation_rationale_missing");
  }
  if (!hasText(mapping.apply_label)) reasons.push("apply_label_missing");
  if (!hasText(mapping.apply_rationale)) reasons.push("apply_rationale_missing");
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
  if (
    !Array.isArray(mapping.selected_candidate_context_refs) ||
    mapping.selected_candidate_context_refs.length === 0
  ) {
    reasons.push("selected_candidate_context_refs_missing");
  }
  if (
    !Array.isArray(mapping.source_next_work_candidate_card_ids) ||
    mapping.source_next_work_candidate_card_ids.length === 0
  ) {
    reasons.push("source_next_work_candidate_card_ids_missing");
  }
  if (!explanatoryMaterialPresent(mapping)) {
    reasons.push("perspective_writer_compatibility_explanation_insufficient");
  }
  if (
    FORBIDDEN_WRITER_COMPATIBILITY_TARGETS.has(mapping.intended_future_writer_target) ||
    !SUPPORTED_WRITER_COMPATIBILITY_TARGETS.has(mapping.intended_future_writer_target)
  ) {
    reasons.push("perspective_writer_compatibility_target_must_be_manual_specific");
  }
  if (
    mapping.default_future_writer_target === "blocked" ||
    !SUPPORTED_WRITER_COMPATIBILITY_TARGETS.has(mapping.default_future_writer_target)
  ) {
    reasons.push("perspective_writer_compatibility_target_must_be_manual_specific");
  }
  if (!SUPPORTED_WRITER_COMPATIBILITY_TARGETS.has(candidate.writer_compatibility_scope_hint)) {
    reasons.push("perspective_writer_compatibility_target_must_be_manual_specific");
  }
  if (!SUPPORTED_WRITER_COMPATIBILITY_STRENGTHS.has(candidate.writer_compatibility_strength_hint)) {
    reasons.push("writer_compatibility_strength_hint_invalid");
  }
  if (
    writePath.recommended_storage_path !==
    "manual_specific_perspective_writer_compatibility_tables"
  ) {
    reasons.push("perspective_writer_compatibility_storage_path_must_be_manual_specific");
  }
  if (writePath.expected_future_write_scope !== "writer_compatibility_record_only") {
    reasons.push("perspective_writer_compatibility_future_write_scope_must_be_record_only");
  }
  if (
    candidate.writes_now !== false ||
    candidate.would_update_current_working_perspective !== false ||
    candidate.would_mutate_existing_canonical_perspective_state !== false ||
    candidate.would_call_existing_current_working_writer !== false ||
    candidate.would_call_existing_canonical_state_writer !== false ||
    candidate.would_promote_perspective !== false ||
    candidate.would_write_perspective_memory !== false ||
    candidate.would_mutate_work !== false ||
    candidate.would_write_proof_or_evidence !== false
  ) {
    reasons.push("perspective_writer_compatibility_requested_side_effects_refused");
  }
  if (
    !contract.authority_boundary.preview_only ||
    !contract.authority_boundary.read_only ||
    contract.authority_boundary.can_write_perspective_writer_compatibility_record !== false ||
    contract.authority_boundary.can_call_existing_current_working_writer !== false ||
    contract.authority_boundary.can_call_existing_canonical_state_writer !== false ||
    contract.authority_boundary.can_update_current_working_perspective !== false ||
    contract.authority_boundary.can_mutate_existing_canonical_perspective_state !==
      false ||
    contract.authority_boundary.can_write_existing_canonical_perspective_state !==
      false ||
    contract.authority_boundary.can_promote_perspective !== false ||
    contract.authority_boundary.can_write_perspective_memory !== false ||
    contract.authority_boundary.can_mutate_work !== false ||
    contract.authority_boundary.can_write_proof_or_evidence !== false
  ) {
    reasons.push("perspective_writer_compatibility_contract_not_ready");
  }
  if (existingWriterCompatibilityClaimed(contract)) {
    reasons.push("perspective_writer_compatibility_existing_writer_claim_refused");
  }
  return reasons;
}

function validateReviewShape(review: JsonRecord) {
  return (
    review.review_kind ===
      "research_candidate_manual_global_dogfood_perspective_writer_compatibility_review" &&
    review.review_version ===
      "research_candidate_manual_global_dogfood_perspective_writer_compatibility_review.v0.1" &&
    hasText(review.source_contract_fingerprint) &&
    isRecord(review.validation) &&
    isRecord(review.authority_boundary)
  );
}

function validateReview(
  review: ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityReview,
  contract: ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityContract,
) {
  const reasons: string[] = [];
  if (
    review.review_status !== "ready_for_future_perspective_writer_compatibility_write_slice" ||
    review.operator_decision !==
      "accept_contract_for_future_perspective_writer_compatibility_write_slice" ||
    review.validation.passed !== true ||
    review.validation.no_write_authority !== true ||
    review.validation.operator_note_persisted !== false
  ) {
    reasons.push("perspective_writer_compatibility_contract_not_ready");
  }
  reasons.push(...validateReviewBoundToContract({ review, contract }));
  return reasons;
}

function validateReviewBoundToContract({
  review,
  contract,
}: {
  review: ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityReview;
  contract: ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityContract;
}) {
  const reasons: string[] = [];
  if (
    review.source_contract_fingerprint !==
      contract.validation.contract_fingerprint
  ) {
    reasons.push("perspective_writer_compatibility_review_contract_mismatch");
  }
  const summary = review.accepted_mapping_summary;
  if (!summary) {
    reasons.push("perspective_writer_compatibility_review_source_mismatch");
    return reasons;
  }
  const mismatches = [
    summary.source_contract_fingerprint !== contract.validation.contract_fingerprint,
    summary.source_perspective_state_application_receipt_id !==
      contract.source_perspective_state_application_receipt_id,
    summary.source_perspective_state_application_record_id !==
      contract.source_perspective_state_application_record_id,
    summary.source_perspective_state_application_record_fingerprint !==
      contract.source_perspective_state_application_record_fingerprint,
    summary.source_perspective_adapter_receipt_id !==
      contract.source_perspective_adapter_receipt_id,
    summary.source_perspective_adapter_record_id !==
      contract.source_perspective_adapter_record_id,
    summary.source_perspective_adapter_record_fingerprint !==
      contract.source_perspective_adapter_record_fingerprint,
    summary.source_perspective_state_mutation_receipt_id !==
      contract.source_perspective_state_mutation_receipt_id,
    summary.source_perspective_state_mutation_record_id !==
      contract.source_perspective_state_mutation_record_id,
    summary.source_perspective_state_mutation_record_fingerprint !==
      contract.source_perspective_state_mutation_record_fingerprint,
    summary.source_perspective_apply_receipt_id !==
      contract.source_perspective_apply_receipt_id,
    summary.source_perspective_apply_record_id !==
      contract.source_perspective_apply_record_id,
    summary.source_perspective_apply_record_fingerprint !==
      contract.source_perspective_apply_record_fingerprint,
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
    summary.source_global_dogfood_ledger_record_id !==
      contract.source_global_dogfood_ledger_record_id,
    summary.source_metric_snapshot_receipt_id !==
      contract.source_metric_snapshot_receipt_id,
    summary.source_metric_snapshot_record_id !==
      contract.source_metric_snapshot_record_id,
    summary.source_manual_receipt_id !== contract.source_manual_receipt_id,
    summary.source_handoff_seed_fingerprint !==
      contract.source_handoff_seed_fingerprint,
    summary.source_result_text_fingerprint !==
      contract.source_result_text_fingerprint,
    summary.source_expected_observed_delta_record_ref !==
      contract.source_expected_observed_delta_record_ref,
    summary.source_reuse_outcome_record_ref !==
      contract.source_reuse_outcome_record_ref,
    summary.proposed_idempotency_key !==
      contract.idempotency_contract_preview.proposed_idempotency_key,
    summary.intended_future_writer_target !==
      contract.proposed_writer_compatibility_mapping.intended_future_writer_target,
    summary.writer_compatibility_label !== contract.proposed_writer_compatibility_mapping.writer_compatibility_label,
    summary.writer_compatibility_rationale !==
      contract.proposed_writer_compatibility_mapping.writer_compatibility_rationale,
    summary.state_application_label !==
      contract.proposed_writer_compatibility_mapping.state_application_label,
    summary.state_application_rationale !==
      contract.proposed_writer_compatibility_mapping.state_application_rationale,
    summary.adapter_label !== contract.proposed_writer_compatibility_mapping.adapter_label,
    summary.adapter_rationale !==
      contract.proposed_writer_compatibility_mapping.adapter_rationale,
    summary.mutation_label !== contract.proposed_writer_compatibility_mapping.mutation_label,
    summary.mutation_rationale !==
      contract.proposed_writer_compatibility_mapping.mutation_rationale,
    summary.apply_label !== contract.proposed_writer_compatibility_mapping.apply_label,
    summary.apply_rationale !== contract.proposed_writer_compatibility_mapping.apply_rationale,
    summary.canonical_update_label !==
      contract.proposed_writer_compatibility_mapping.canonical_update_label,
    summary.canonical_update_rationale !==
      contract.proposed_writer_compatibility_mapping.canonical_update_rationale,
  ];
  if (mismatches.some(Boolean)) {
    reasons.push("perspective_writer_compatibility_review_source_mismatch");
  }
  return reasons;
}

function validateOperatorAuthorization(operatorAuthorization: JsonRecord) {
  const reasons: string[] = [];
  if (
    operatorAuthorization.authorization_kind !==
    "manual_operator_authorized_perspective_writer_compatibility_write"
  ) {
    reasons.push("perspective_writer_compatibility_operator_authorization_shape_invalid");
  }
  if (
    operatorAuthorization.operator_confirmation_text !==
    RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_WRITER_COMPATIBILITY_WRITE_CONFIRMATION
  ) {
    reasons.push("perspective_writer_compatibility_wrong_confirmation");
  }
  if (
    operatorAuthorization.write_mode !== "commit" &&
    operatorAuthorization.write_mode !== "replay_if_duplicate" &&
    operatorAuthorization.write_mode !== "supersede_previous"
  ) {
    reasons.push("perspective_writer_compatibility_operator_authorization_shape_invalid");
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
  db: PerspectiveWriterCompatibilityDbLike;
  request: ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityWriteRequest;
  ignoreRequestSuppliedReadbacks?: boolean;
}) {
  const reasons: string[] = [];
  const contract = request.perspective_writer_compatibility_contract;
  const sourceStateApplication = hasText(
    contract.source_perspective_state_application_receipt_id,
  )
    ? readResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationByReceiptId(
        contract.source_perspective_state_application_receipt_id!,
        { scope: contract.scope, db },
      )
    : null;
  if (
    !sourceStateApplication ||
    sourceStateApplication.receipt.write_status !== "committed"
  ) {
    reasons.push(
      "perspective_writer_compatibility_source_state_application_receipt_not_active_committed",
    );
    return reasons;
  }
  const sourceStateApplicationReadback =
    readResearchCandidateManualGlobalDogfoodPerspectiveStateApplication({
      scope: contract.scope,
      receiptId: contract.source_perspective_state_application_receipt_id,
      limit: 1,
      db,
    });
  if (
    sourceStateApplicationReadback.latest_active_committed?.receipt.receipt_id !==
    contract.source_perspective_state_application_receipt_id
  ) {
    reasons.push(
      "perspective_writer_compatibility_source_state_application_receipt_not_active_committed",
    );
  }
  if (
    stateApplicationRecordMismatchesContract({
      sourceStateApplication,
      contract,
    })
  ) {
    reasons.push(
      "perspective_writer_compatibility_source_state_application_record_mismatch",
    );
  }
  if (!sourceStateApplicationReadbackFlagsAreClean(sourceStateApplicationReadback)) {
    reasons.push("perspective_writer_compatibility_source_readback_forbidden_mutation_flag");
  }
  if (
    !ignoreRequestSuppliedReadbacks &&
    request.source_perspective_state_application_readback &&
    !sourceStateApplicationReadbackFlagsAreClean(
      request.source_perspective_state_application_readback,
    )
  ) {
    reasons.push("perspective_writer_compatibility_source_readback_forbidden_mutation_flag");
  }
  return uniqueStrings(reasons);
}

function getSourceStateApplicationForRequest({
  db,
  request,
}: {
  db: PerspectiveWriterCompatibilityDbLike;
  request: ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityWriteRequest;
}) {
  const receiptId =
    request.perspective_writer_compatibility_contract
      .source_perspective_state_application_receipt_id ?? "";
  return readResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationByReceiptId(
    receiptId,
    { scope: request.perspective_writer_compatibility_contract.scope, db },
  );
}

function stateApplicationRecordMismatchesContract({
  sourceStateApplication,
  contract,
}: {
  sourceStateApplication: NonNullable<
    ReturnType<typeof readResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationByReceiptId>
  >;
  contract: ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityContract;
}) {
  const record = sourceStateApplication.perspective_state_application_record;
  const mapping = contract.proposed_writer_compatibility_mapping;
  return (
    !record ||
    sourceStateApplication.receipt.receipt_id !==
      contract.source_perspective_state_application_receipt_id ||
    record.perspective_state_application_record_id !==
      contract.source_perspective_state_application_record_id ||
    record.perspective_state_application_record_fingerprint !==
      contract.source_perspective_state_application_record_fingerprint ||
    sourceStateApplication.receipt.source_perspective_adapter_receipt_id !==
      contract.source_perspective_adapter_receipt_id ||
    sourceStateApplication.receipt.source_perspective_adapter_record_id !==
      contract.source_perspective_adapter_record_id ||
    sourceStateApplication.receipt.source_perspective_adapter_record_fingerprint !==
      contract.source_perspective_adapter_record_fingerprint ||
    sourceStateApplication.receipt.source_perspective_state_mutation_receipt_id !==
      contract.source_perspective_state_mutation_receipt_id ||
    sourceStateApplication.receipt.source_perspective_state_mutation_record_id !==
      contract.source_perspective_state_mutation_record_id ||
    sourceStateApplication.receipt.source_perspective_state_mutation_record_fingerprint !==
      contract.source_perspective_state_mutation_record_fingerprint ||
    sourceStateApplication.receipt.source_perspective_apply_receipt_id !==
      contract.source_perspective_apply_receipt_id ||
    sourceStateApplication.receipt.source_perspective_apply_record_id !==
      contract.source_perspective_apply_record_id ||
    sourceStateApplication.receipt.source_perspective_apply_record_fingerprint !==
      contract.source_perspective_apply_record_fingerprint ||
    sourceStateApplication.receipt.source_canonical_perspective_update_receipt_id !==
      contract.source_canonical_perspective_update_receipt_id ||
    sourceStateApplication.receipt.source_canonical_perspective_update_record_id !==
      contract.source_canonical_perspective_update_record_id ||
    sourceStateApplication.receipt.source_canonical_perspective_update_record_fingerprint !==
      contract.source_canonical_perspective_update_record_fingerprint ||
    sourceStateApplication.receipt.source_perspective_relay_receipt_id !==
      contract.source_perspective_relay_receipt_id ||
    sourceStateApplication.receipt.source_perspective_relay_record_id !==
      contract.source_perspective_relay_record_id ||
    sourceStateApplication.receipt.source_perspective_relay_record_fingerprint !==
      contract.source_perspective_relay_record_fingerprint ||
    sourceStateApplication.receipt.source_next_work_signal_receipt_id !==
      contract.source_next_work_signal_receipt_id ||
    sourceStateApplication.receipt.source_next_work_signal_record_id !==
      contract.source_next_work_signal_record_id ||
    sourceStateApplication.receipt.source_next_work_signal_record_fingerprint !==
      contract.source_next_work_signal_record_fingerprint ||
    sourceStateApplication.receipt.source_next_work_bias_receipt_id !==
      contract.source_next_work_bias_receipt_id ||
    sourceStateApplication.receipt.source_next_work_bias_record_id !==
      contract.source_next_work_bias_record_id ||
    sourceStateApplication.receipt.source_next_work_bias_record_fingerprint !==
      contract.source_next_work_bias_record_fingerprint ||
    sourceStateApplication.receipt.source_projection_fingerprint !==
      contract.source_projection_fingerprint ||
    sourceStateApplication.receipt.source_global_dogfood_ledger_receipt_id !==
      contract.source_global_dogfood_ledger_receipt_id ||
    sourceStateApplication.receipt.source_global_dogfood_ledger_record_id !==
      contract.source_global_dogfood_ledger_record_id ||
    sourceStateApplication.receipt.source_metric_snapshot_receipt_id !==
      contract.source_metric_snapshot_receipt_id ||
    sourceStateApplication.receipt.source_metric_snapshot_record_id !==
      contract.source_metric_snapshot_record_id ||
    sourceStateApplication.receipt.source_manual_receipt_id !==
      contract.source_manual_receipt_id ||
    sourceStateApplication.receipt.source_handoff_seed_fingerprint !==
      contract.source_handoff_seed_fingerprint ||
    sourceStateApplication.receipt.source_result_text_fingerprint !==
      contract.source_result_text_fingerprint ||
    sourceStateApplication.receipt.source_expected_observed_delta_record_ref !==
      contract.source_expected_observed_delta_record_ref ||
    sourceStateApplication.receipt.source_reuse_outcome_record_ref !==
      contract.source_reuse_outcome_record_ref ||
    record.state_application_label !== mapping.state_application_label ||
    record.state_application_rationale !== mapping.state_application_rationale ||
    record.adapter_label !== mapping.adapter_label ||
    record.adapter_rationale !== mapping.adapter_rationale ||
    record.mutation_label !== mapping.mutation_label ||
    record.mutation_rationale !== mapping.mutation_rationale ||
    record.apply_label !== mapping.apply_label ||
    record.apply_rationale !== mapping.apply_rationale ||
    record.canonical_update_label !== mapping.canonical_update_label ||
    record.canonical_update_rationale !== mapping.canonical_update_rationale ||
    record.relay_update_label !== mapping.relay_update_label ||
    record.relay_update_rationale !== mapping.relay_update_rationale ||
    record.recommended_next_work_label !== mapping.recommended_next_work_label ||
    record.outcome_label !== mapping.outcome_label ||
    record.outcome_signal !== mapping.outcome_signal ||
    record.recommended_storage_path !== "manual_specific_perspective_state_application_tables" ||
    record.expected_future_write_scope !== "state_application_record_only" ||
    stableJson(record.selected_candidate_context_refs) !==
      stableJson(mapping.selected_candidate_context_refs) ||
    stableJson(record.source_next_work_candidate_card_ids) !==
      stableJson(mapping.source_next_work_candidate_card_ids) ||
    stableJson(record.manual_only_context_refs) !==
      stableJson(mapping.manual_only_context_refs)
  );
}

function sourceStateApplicationReadbackFlagsAreClean(
  readback: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationReadback,
) {
  return (
    readback.current_working_perspective_updated === false &&
    readback.existing_canonical_perspective_state_table_mutated === false &&
    readback.canonical_perspective_state_written === false &&
    readback.perspective_promoted === false &&
    readback.perspective_memory_written === false &&
    (!("perspective_state_application_record_mutated" in readback) ||
      readback.perspective_state_application_record_mutated === false) &&
    readback.perspective_state_mutation_record_mutated === false &&
    readback.perspective_adapter_record_mutated === false &&
    readback.perspective_apply_record_mutated === false &&
    readback.canonical_perspective_update_record_mutated === false &&
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
  db: PerspectiveWriterCompatibilityDbLike;
  request: ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityWriteRequest;
}) {
  const supersedesReceiptId =
    request.operator_authorization.supersedes_receipt_id ?? "";
  const target = readResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityByReceiptId(
    supersedesReceiptId,
    { scope: request.perspective_writer_compatibility_contract.scope, db },
  );
  if (!target) return "supersedes_receipt_id_not_found";
  if (target.receipt.write_status !== "committed") {
    return "supersedes_receipt_not_committed";
  }
  const update = db
    .prepare(
      `
        UPDATE research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts
        SET write_status = 'superseded'
        WHERE receipt_id = ?
          AND scope = ?
          AND write_status = 'committed'
      `,
    )
    .run(supersedesReceiptId, request.perspective_writer_compatibility_contract.scope);
  return getRunChangeCount(update) === 1
    ? null
    : "supersedes_receipt_not_committed";
}

function validateSupersedeTargetForRequest({
  db,
  request,
  existingReceipt,
}: {
  db: PerspectiveWriterCompatibilityDbLike;
  request: ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityWriteRequest;
  existingReceipt: ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityWriteReceipt | null;
}) {
  const supersedesReceiptId =
    request.operator_authorization.supersedes_receipt_id ?? "";
  const target = readResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityByReceiptId(
    supersedesReceiptId,
    { scope: request.perspective_writer_compatibility_contract.scope, db },
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
  sourceStateApplication,
  idempotencyKey,
  createdAt,
}: {
  request: ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityWriteRequest;
  sourceStateApplication: NonNullable<
    ReturnType<typeof readResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationByReceiptId>
  >;
  idempotencyKey: string;
  createdAt: string;
}): ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityWriteReceipt {
  const contract = request.perspective_writer_compatibility_contract;
  const sourceStateApplicationRecord =
    sourceStateApplication.perspective_state_application_record!;
  const source = {
    scope: contract.scope,
    source_perspective_writer_compatibility_contract_fingerprint:
      contract.validation.contract_fingerprint,
    source_perspective_writer_compatibility_review_fingerprint:
      request.perspective_writer_compatibility_review.validation.review_fingerprint,
    source_perspective_state_application_receipt_id:
      sourceStateApplication.receipt.receipt_id,
    source_perspective_state_application_record_id:
      sourceStateApplicationRecord.perspective_state_application_record_id,
    source_perspective_state_application_record_fingerprint:
      sourceStateApplicationRecord.perspective_state_application_record_fingerprint,
    source_perspective_adapter_receipt_id:
      sourceStateApplication.receipt.source_perspective_adapter_receipt_id,
    source_perspective_adapter_record_id:
      sourceStateApplication.receipt.source_perspective_adapter_record_id,
    source_perspective_adapter_record_fingerprint:
      sourceStateApplication.receipt.source_perspective_adapter_record_fingerprint,
    source_perspective_state_mutation_receipt_id:
      sourceStateApplication.receipt.source_perspective_state_mutation_receipt_id,
    source_perspective_state_mutation_record_id:
      sourceStateApplication.receipt.source_perspective_state_mutation_record_id,
    source_perspective_state_mutation_record_fingerprint:
      sourceStateApplication.receipt
        .source_perspective_state_mutation_record_fingerprint,
    source_perspective_apply_receipt_id:
      sourceStateApplication.receipt.source_perspective_apply_receipt_id,
    source_perspective_apply_record_id:
      sourceStateApplication.receipt.source_perspective_apply_record_id,
    source_perspective_apply_record_fingerprint:
      sourceStateApplication.receipt.source_perspective_apply_record_fingerprint,
    source_canonical_perspective_update_receipt_id:
      sourceStateApplication.receipt
        .source_canonical_perspective_update_receipt_id,
    source_canonical_perspective_update_record_id:
      sourceStateApplication.receipt
        .source_canonical_perspective_update_record_id,
    source_canonical_perspective_update_record_fingerprint:
      sourceStateApplication.receipt
        .source_canonical_perspective_update_record_fingerprint,
    source_perspective_relay_receipt_id:
      sourceStateApplication.receipt.source_perspective_relay_receipt_id,
    source_perspective_relay_record_id:
      sourceStateApplication.receipt.source_perspective_relay_record_id,
    source_perspective_relay_record_fingerprint:
      sourceStateApplication.receipt.source_perspective_relay_record_fingerprint,
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
  const receiptId = `manual-global-dogfood-perspective-writer-compatibility-receipt:${fingerprint({
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

function buildPerspectiveWriterCompatibilityRecord({
  request,
  sourceStateApplication,
  receipt,
  createdAt,
}: {
  request: ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityWriteRequest;
  sourceStateApplication: NonNullable<
    ReturnType<typeof readResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationByReceiptId>
  >;
  receipt: ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityWriteReceipt;
  createdAt: string;
}): ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityRecord {
  const contract = request.perspective_writer_compatibility_contract;
  const mapping = contract.proposed_writer_compatibility_mapping;
  const candidate = contract.proposed_writer_compatibility_candidate;
  const writePath = contract.proposed_manual_writer_compatibility_path;
  const sourceStateApplicationRecord =
    sourceStateApplication.perspective_state_application_record!;
  const sourceRefs = uniqueStrings([
    contract.source_perspective_state_application_readback_ref,
    sourceStateApplication.receipt.receipt_id,
    sourceStateApplicationRecord.perspective_state_application_record_id,
    sourceStateApplicationRecord.perspective_state_application_record_fingerprint,
    contract.source_perspective_adapter_receipt_id,
    contract.source_perspective_adapter_record_id,
    contract.source_perspective_adapter_record_fingerprint,
    contract.source_perspective_state_mutation_receipt_id,
    contract.source_perspective_state_mutation_record_id,
    contract.source_perspective_state_mutation_record_fingerprint,
    contract.source_perspective_apply_receipt_id,
    contract.source_perspective_apply_record_id,
    contract.source_perspective_apply_record_fingerprint,
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
    contract.validation.contract_fingerprint,
    request.perspective_writer_compatibility_review.validation.review_fingerprint,
    ...mapping.source_next_work_candidate_card_ids,
    ...mapping.selected_candidate_context_refs,
    ...mapping.manual_only_context_refs,
  ]);
  const source = {
    receipt_id: receipt.receipt_id,
    scope: contract.scope,
    source_perspective_state_application_receipt_id:
      sourceStateApplication.receipt.receipt_id,
    source_perspective_state_application_record_id:
      sourceStateApplicationRecord.perspective_state_application_record_id,
    source_perspective_adapter_receipt_id:
      sourceStateApplication.receipt.source_perspective_adapter_receipt_id,
    source_perspective_adapter_record_id:
      sourceStateApplication.receipt.source_perspective_adapter_record_id,
    source_perspective_state_mutation_receipt_id:
      sourceStateApplication.receipt.source_perspective_state_mutation_receipt_id,
    source_perspective_state_mutation_record_id:
      sourceStateApplication.receipt.source_perspective_state_mutation_record_id,
    source_perspective_apply_receipt_id:
      sourceStateApplication.receipt.source_perspective_apply_receipt_id,
    source_perspective_apply_record_id:
      sourceStateApplication.receipt.source_perspective_apply_record_id,
    source_canonical_perspective_update_receipt_id:
      sourceStateApplication.receipt
        .source_canonical_perspective_update_receipt_id,
    source_canonical_perspective_update_record_id:
      sourceStateApplication.receipt
        .source_canonical_perspective_update_record_id,
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
    writer_compatibility_label: mapping.writer_compatibility_label!,
    writer_compatibility_rationale: mapping.writer_compatibility_rationale!,
    state_application_label: mapping.state_application_label!,
    state_application_rationale: mapping.state_application_rationale!,
    adapter_label: mapping.adapter_label!,
    adapter_rationale: mapping.adapter_rationale!,
    mutation_label: mapping.mutation_label!,
    mutation_rationale: mapping.mutation_rationale!,
    apply_label: mapping.apply_label!,
    apply_rationale: mapping.apply_rationale!,
    canonical_update_label: mapping.canonical_update_label!,
    canonical_update_rationale: mapping.canonical_update_rationale!,
    relay_update_label: mapping.relay_update_label!,
    relay_update_rationale: mapping.relay_update_rationale!,
    recommended_next_work_label: mapping.recommended_next_work_label!,
    outcome_label: mapping.outcome_label!,
    outcome_signal: mapping.outcome_signal!,
    intended_future_writer_target: mapping.intended_future_writer_target as
      | "manual_specific_existing_canonical_state_writer_adapter"
      | "manual_specific_current_working_writer_adapter",
    default_future_writer_target: mapping.default_future_writer_target as
      | "manual_specific_existing_canonical_state_writer_adapter"
      | "manual_specific_current_working_writer_adapter",
    writer_compatibility_scope_hint: candidate.writer_compatibility_scope_hint as
      | "manual_specific_existing_canonical_state_writer_adapter"
      | "manual_specific_current_working_writer_adapter",
    writer_compatibility_strength_hint: candidate.writer_compatibility_strength_hint as
      | "low"
      | "medium"
      | "high",
    expected_future_write_scope: writePath.expected_future_write_scope as
      "writer_compatibility_record_only",
    recommended_storage_path: writePath.recommended_storage_path as
      "manual_specific_perspective_writer_compatibility_tables",
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
    existing_current_working_writer_compatibility:
      contract.existing_current_working_writer_compatibility as unknown as Record<
        string,
        unknown
      >,
    existing_canonical_state_writer_compatibility:
      contract.existing_canonical_state_writer_compatibility as unknown as Record<
        string,
        unknown
      >,
    manual_writer_compatibility_path:
      contract.proposed_manual_writer_compatibility_path as unknown as Record<
        string,
        unknown
      >,
    source_refs: sourceRefs,
  };
  const recordId = `manual-global-dogfood-perspective-writer-compatibility-record:${fingerprint({
    ...source,
    created_at: createdAt,
  })}`;
  return {
    perspective_writer_compatibility_record_id: recordId,
    created_at: createdAt,
    ...source,
    outcome_signal: source.outcome_signal as "positive" | "negative" | "ambiguous",
    authority_profile: AUTHORITY_PROFILE,
    perspective_writer_compatibility_record_fingerprint: fingerprint({
      ...source,
      perspective_writer_compatibility_record_id: recordId,
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
}): ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityRollbackRecord {
  const rollbackId = `manual-global-dogfood-perspective-writer-compatibility-rollback:${fingerprint({
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
  db: PerspectiveWriterCompatibilityDbLike,
  receipt: ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityWriteReceipt,
) {
  db.prepare(
    `
      INSERT INTO research_candidate_manual_global_dogfood_perspective_writer_compatibility_receipts (
        receipt_id,
        created_at,
        scope,
        source_perspective_writer_compatibility_contract_fingerprint,
        source_perspective_writer_compatibility_review_fingerprint,
        source_perspective_state_application_receipt_id,
        source_perspective_state_application_record_id,
        source_perspective_state_application_record_fingerprint,
        source_perspective_adapter_receipt_id,
        source_perspective_adapter_record_id,
        source_perspective_adapter_record_fingerprint,
        source_perspective_state_mutation_receipt_id,
        source_perspective_state_mutation_record_id,
        source_perspective_state_mutation_record_fingerprint,
        source_perspective_apply_receipt_id,
        source_perspective_apply_record_id,
        source_perspective_apply_record_fingerprint,
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
      ) VALUES (
        @receipt_id,
        @created_at,
        @scope,
        @source_perspective_writer_compatibility_contract_fingerprint,
        @source_perspective_writer_compatibility_review_fingerprint,
        @source_perspective_state_application_receipt_id,
        @source_perspective_state_application_record_id,
        @source_perspective_state_application_record_fingerprint,
        @source_perspective_adapter_receipt_id,
        @source_perspective_adapter_record_id,
        @source_perspective_adapter_record_fingerprint,
        @source_perspective_state_mutation_receipt_id,
        @source_perspective_state_mutation_record_id,
        @source_perspective_state_mutation_record_fingerprint,
        @source_perspective_apply_receipt_id,
        @source_perspective_apply_record_id,
        @source_perspective_apply_record_fingerprint,
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

function insertPerspectiveWriterCompatibilityRecord(
  db: PerspectiveWriterCompatibilityDbLike,
  record: ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityRecord,
) {
  db.prepare(
    `
      INSERT INTO research_candidate_manual_global_dogfood_perspective_writer_compatibility_records (
        perspective_writer_compatibility_record_id,
        receipt_id,
        created_at,
        scope,
        source_perspective_state_application_receipt_id,
        source_perspective_state_application_record_id,
        source_perspective_adapter_receipt_id,
        source_perspective_adapter_record_id,
        source_perspective_state_mutation_receipt_id,
        source_perspective_state_mutation_record_id,
        source_perspective_apply_receipt_id,
        source_perspective_apply_record_id,
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
        writer_compatibility_label,
        writer_compatibility_rationale,
        state_application_label,
        state_application_rationale,
        adapter_label,
        adapter_rationale,
        mutation_label,
        mutation_rationale,
        apply_label,
        apply_rationale,
        canonical_update_label,
        canonical_update_rationale,
        relay_update_label,
        relay_update_rationale,
        recommended_next_work_label,
        outcome_label,
        outcome_signal,
        intended_future_writer_target,
        default_future_writer_target,
        writer_compatibility_scope_hint,
        writer_compatibility_strength_hint,
        expected_future_write_scope,
        recommended_storage_path,
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
        existing_current_working_writer_compatibility_json,
        existing_canonical_state_writer_compatibility_json,
        manual_writer_compatibility_path_json,
        source_refs_json,
        authority_profile,
        perspective_writer_compatibility_record_fingerprint
      ) VALUES (
        @perspective_writer_compatibility_record_id,
        @receipt_id,
        @created_at,
        @scope,
        @source_perspective_state_application_receipt_id,
        @source_perspective_state_application_record_id,
        @source_perspective_adapter_receipt_id,
        @source_perspective_adapter_record_id,
        @source_perspective_state_mutation_receipt_id,
        @source_perspective_state_mutation_record_id,
        @source_perspective_apply_receipt_id,
        @source_perspective_apply_record_id,
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
        @writer_compatibility_label,
        @writer_compatibility_rationale,
        @state_application_label,
        @state_application_rationale,
        @adapter_label,
        @adapter_rationale,
        @mutation_label,
        @mutation_rationale,
        @apply_label,
        @apply_rationale,
        @canonical_update_label,
        @canonical_update_rationale,
        @relay_update_label,
        @relay_update_rationale,
        @recommended_next_work_label,
        @outcome_label,
        @outcome_signal,
        @intended_future_writer_target,
        @default_future_writer_target,
        @writer_compatibility_scope_hint,
        @writer_compatibility_strength_hint,
        @expected_future_write_scope,
        @recommended_storage_path,
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
        @existing_current_working_writer_compatibility_json,
        @existing_canonical_state_writer_compatibility_json,
        @manual_writer_compatibility_path_json,
        @source_refs_json,
        @authority_profile,
        @perspective_writer_compatibility_record_fingerprint
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
    existing_current_working_writer_compatibility_json: JSON.stringify(
      record.existing_current_working_writer_compatibility,
    ),
    existing_canonical_state_writer_compatibility_json: JSON.stringify(
      record.existing_canonical_state_writer_compatibility,
    ),
    manual_writer_compatibility_path_json: JSON.stringify(
      record.manual_writer_compatibility_path,
    ),
    source_refs_json: JSON.stringify(record.source_refs),
  });
}

function insertRollback(
  db: PerspectiveWriterCompatibilityDbLike,
  rollback: ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityRollbackRecord,
) {
  db.prepare(
    `
      INSERT INTO research_candidate_manual_global_dogfood_perspective_writer_compatibility_rollbacks (
        rollback_id,
        created_at,
        receipt_id,
        rollback_reason,
        authority_profile,
        rollback_fingerprint
      ) VALUES (
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
  validation: ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityWriteValidation;
  readback: ReturnType<typeof readResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibility>;
}): ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityWriteResult {
  const existing = readback.records_by_receipt[0] ?? null;
  return {
    ok: true,
    result_status: "duplicate_replayed",
    validation,
    receipt: existing?.receipt ?? null,
    perspective_writer_compatibility_record: existing?.perspective_writer_compatibility_record ?? null,
    readback,
    refusal_reasons: [],
    duplicate_replayed: true,
    idempotency_key: validation.idempotency_key,
    authority_boundary:
      getResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityWriteAuthorityBoundary(),
    ...writeResultFlags(Boolean(existing?.perspective_writer_compatibility_record)),
  };
}

function refusedResult({
  validation,
  idempotencyKey,
}: {
  validation: ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityWriteValidation;
  idempotencyKey: string | null;
}): ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityWriteResult {
  return {
    ok: false,
    result_status: "refused",
    validation,
    receipt: null,
    perspective_writer_compatibility_record: null,
    readback: null,
    refusal_reasons: validation.failure_codes,
    duplicate_replayed: false,
    idempotency_key: idempotencyKey,
    authority_boundary:
      getResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityWriteAuthorityBoundary(),
    ...writeResultFlags(false),
  };
}

function rollbackRefused({
  resultStatus = "refused",
  refusalReasons,
  readback,
}: {
  resultStatus?: "refused" | "not_found";
  refusalReasons: string[];
  readback: ReturnType<typeof readResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibility>;
}): ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityRollbackResult {
  return {
    ok: false,
    result_status: resultStatus,
    rollback: null,
    receipt: readback.records_by_receipt[0]?.receipt ?? null,
    readback,
    refusal_reasons: refusalReasons,
    authority_boundary:
      getResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityWriteAuthorityBoundary(),
    ...rollbackResultFlags(false),
  };
}

function validationWithFailures(
  validation: ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityWriteValidation,
  failures: string[],
): ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityWriteValidation {
  const failureCodes = uniqueStrings([...validation.failure_codes, ...failures]);
  return {
    ...validation,
    passed: failureCodes.length === 0,
    failure_codes: failureCodes,
    source_perspective_state_application_receipt_active_committed:
      !failureCodes.includes(
        "perspective_writer_compatibility_source_state_application_receipt_not_active_committed",
      ),
    source_perspective_state_application_record_matches_contract:
      !failureCodes.includes(
        "perspective_writer_compatibility_source_state_application_record_mismatch",
      ),
    source_readback_flags_preserve_no_forbidden_mutation:
      !failureCodes.includes(
        "perspective_writer_compatibility_source_readback_forbidden_mutation_flag",
      ),
  };
}

function buildValidation({
  reasons,
  request,
  idempotencyKey,
}: {
  reasons: string[];
  request: unknown;
  idempotencyKey: string | null;
}): ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityWriteValidation {
  const failureCodes = uniqueStrings(reasons);
  const contractRecord =
    isRecord(request) && isRecord(request.perspective_writer_compatibility_contract)
      ? (request.perspective_writer_compatibility_contract as unknown as JsonRecord)
      : null;
  const contractShapeValid =
    contractRecord !== null && validateContractShape(contractRecord);
  const contract = contractShapeValid
    ? (contractRecord as unknown as ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityContract)
    : undefined;
  const mapping = contract?.proposed_writer_compatibility_mapping;
  const candidate = contract?.proposed_writer_compatibility_candidate;
  const writePath = contract?.proposed_manual_writer_compatibility_path;
  return {
    passed: failureCodes.length === 0,
    failure_codes: failureCodes,
    idempotency_key: idempotencyKey,
    exact_operator_confirmation_present:
      isRecord(request) &&
      isRecord(request.operator_authorization) &&
      request.operator_authorization.operator_confirmation_text ===
        RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_WRITER_COMPATIBILITY_WRITE_CONFIRMATION,
    ready_perspective_writer_compatibility_contract_present:
      Boolean(contract) &&
      !failureCodes.includes("perspective_writer_compatibility_contract_shape_invalid") &&
      !failureCodes.includes("perspective_writer_compatibility_contract_not_ready"),
    accepted_perspective_writer_compatibility_review_present:
      !failureCodes.includes("perspective_writer_compatibility_review_shape_invalid") &&
      !failureCodes.includes("perspective_writer_compatibility_review_contract_mismatch") &&
      !failureCodes.includes("perspective_writer_compatibility_review_source_mismatch"),
    preview_contract_remained_non_writing:
      candidate?.writes_now === false &&
      candidate?.would_update_current_working_perspective === false &&
      candidate?.would_mutate_existing_canonical_perspective_state === false &&
      candidate?.would_call_existing_current_working_writer === false &&
      candidate?.would_call_existing_canonical_state_writer === false &&
      candidate?.would_promote_perspective === false &&
      candidate?.would_write_perspective_memory === false &&
      candidate?.would_mutate_work === false &&
      candidate?.would_write_proof_or_evidence === false,
    preview_authority_boundary_was_read_only:
      Boolean(contract?.authority_boundary?.preview_only) &&
      Boolean(contract?.authority_boundary?.read_only) &&
      contract?.authority_boundary.can_write_perspective_writer_compatibility_record ===
        false,
    writer_authority_boundary_is_narrow: writerAuthorityBoundaryIsNarrow(),
    raw_text_fields_absent: !failureCodes.includes("raw_text_fields_present"),
    operator_note_absent: !failureCodes.includes("operator_notes_present"),
    source_refs_present: contract ? sourceRefsPresent(contract) : false,
    source_perspective_state_application_receipt_active_committed:
      !failureCodes.includes(
        "perspective_writer_compatibility_source_state_application_receipt_not_active_committed",
      ),
    source_perspective_state_application_record_matches_contract:
      !failureCodes.includes(
        "perspective_writer_compatibility_source_state_application_record_mismatch",
      ),
    source_readback_flags_preserve_no_forbidden_mutation:
      !failureCodes.includes(
        "perspective_writer_compatibility_source_readback_forbidden_mutation_flag",
      ),
    handoff_seed_fingerprint_present: hasText(
      contract?.source_handoff_seed_fingerprint,
    ),
    result_text_fingerprint_present: hasText(
      contract?.source_result_text_fingerprint,
    ),
    writer_compatibility_label_present: hasText(mapping?.writer_compatibility_label),
    writer_compatibility_rationale_present: hasText(mapping?.writer_compatibility_rationale),
    state_application_label_present: hasText(mapping?.state_application_label),
    state_application_rationale_present: hasText(mapping?.state_application_rationale),
    adapter_label_present: hasText(mapping?.adapter_label),
    adapter_rationale_present: hasText(mapping?.adapter_rationale),
    mutation_label_present: hasText(mapping?.mutation_label),
    mutation_rationale_present: hasText(mapping?.mutation_rationale),
    apply_label_present: hasText(mapping?.apply_label),
    apply_rationale_present: hasText(mapping?.apply_rationale),
    canonical_update_label_present: hasText(mapping?.canonical_update_label),
    canonical_update_rationale_present: hasText(
      mapping?.canonical_update_rationale,
    ),
    relay_update_label_present: hasText(mapping?.relay_update_label),
    relay_update_rationale_present: hasText(mapping?.relay_update_rationale),
    selected_candidate_context_refs_present:
      Array.isArray(mapping?.selected_candidate_context_refs) &&
      mapping.selected_candidate_context_refs.length > 0,
    source_next_work_candidate_card_ids_present:
      Array.isArray(mapping?.source_next_work_candidate_card_ids) &&
      mapping.source_next_work_candidate_card_ids.length > 0,
    writer_compatibility_target_is_manual_specific:
      !!mapping &&
      SUPPORTED_WRITER_COMPATIBILITY_TARGETS.has(mapping.intended_future_writer_target),
    default_writer_compatibility_target_is_manual_specific:
      !!mapping &&
      SUPPORTED_WRITER_COMPATIBILITY_TARGETS.has(mapping.default_future_writer_target),
    writer_compatibility_scope_hint_is_manual_specific:
      !!candidate && SUPPORTED_WRITER_COMPATIBILITY_TARGETS.has(candidate.writer_compatibility_scope_hint),
    storage_path_is_manual_specific:
      writePath?.recommended_storage_path ===
      "manual_specific_perspective_writer_compatibility_tables",
    future_write_scope_is_writer_compatibility_record_only:
      writePath?.expected_future_write_scope === "writer_compatibility_record_only",
    proposed_perspective_writer_compatibility_candidate_ready:
      candidate?.candidate_status ===
      "ready_for_future_perspective_writer_compatibility_write_authorization",
    existing_writer_compatibility_claim_refused: !failureCodes.includes(
      "perspective_writer_compatibility_existing_writer_claim_refused",
    ),
  };
}

function validateRollbackRequest(request: unknown) {
  const reasons: string[] = [];
  if (!isRecord(request)) {
    return { ok: false, reasons: ["perspective_writer_compatibility_rollback_shape_invalid"] };
  }
  if (!hasText(request.receipt_id)) {
    reasons.push("perspective_writer_compatibility_receipt_id_missing");
  }
  if (!isRecord(request.rollback_authorization)) {
    reasons.push("perspective_writer_compatibility_rollback_authorization_shape_invalid");
  } else {
    if (
      request.rollback_authorization.authorization_kind !==
      "manual_operator_authorized_perspective_writer_compatibility_rollback"
    ) {
      reasons.push("perspective_writer_compatibility_rollback_authorization_shape_invalid");
    }
    if (
      request.rollback_authorization.operator_confirmation_text !==
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_WRITER_COMPATIBILITY_ROLLBACK_CONFIRMATION
    ) {
      reasons.push("perspective_writer_compatibility_wrong_confirmation");
    }
    if (!hasText(request.rollback_authorization.rollback_reason)) {
      reasons.push("perspective_writer_compatibility_rollback_reason_missing");
    }
  }
  if (!rawTextFieldsAbsent(request)) reasons.push("raw_text_fields_present");
  if (!operatorNotesAbsentFromPersistedRequest(request)) {
    reasons.push("operator_notes_present");
  }
  return { ok: reasons.length === 0, reasons };
}

function computePerspectiveWriterCompatibilityIdempotencyKey(
  contract: ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityContract,
) {
  const mapping = contract.proposed_writer_compatibility_mapping;
  const candidate = contract.proposed_writer_compatibility_candidate;
  const writePath = contract.proposed_manual_writer_compatibility_path;
  return `manual-global-dogfood-perspective-writer-compatibility-write:${fingerprint({
    write_version:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_WRITER_COMPATIBILITY_WRITE_VERSION,
    contract_fingerprint: contract.validation.contract_fingerprint,
    source_perspective_state_application_receipt_id:
      contract.source_perspective_state_application_receipt_id,
    source_perspective_state_application_record_id:
      contract.source_perspective_state_application_record_id,
    source_perspective_state_application_record_fingerprint:
      contract.source_perspective_state_application_record_fingerprint,
    source_perspective_adapter_receipt_id:
      contract.source_perspective_adapter_receipt_id,
    source_perspective_adapter_record_id:
      contract.source_perspective_adapter_record_id,
    source_perspective_adapter_record_fingerprint:
      contract.source_perspective_adapter_record_fingerprint,
    source_perspective_state_mutation_receipt_id:
      contract.source_perspective_state_mutation_receipt_id,
    source_perspective_state_mutation_record_id:
      contract.source_perspective_state_mutation_record_id,
    source_perspective_state_mutation_record_fingerprint:
      contract.source_perspective_state_mutation_record_fingerprint,
    source_perspective_apply_receipt_id:
      contract.source_perspective_apply_receipt_id,
    source_perspective_apply_record_id:
      contract.source_perspective_apply_record_id,
    source_perspective_apply_record_fingerprint:
      contract.source_perspective_apply_record_fingerprint,
    source_canonical_perspective_update_receipt_id:
      contract.source_canonical_perspective_update_receipt_id,
    source_canonical_perspective_update_record_id:
      contract.source_canonical_perspective_update_record_id,
    source_canonical_perspective_update_record_fingerprint:
      contract.source_canonical_perspective_update_record_fingerprint,
    source_perspective_relay_receipt_id:
      contract.source_perspective_relay_receipt_id,
    source_perspective_relay_record_id: contract.source_perspective_relay_record_id,
    source_perspective_relay_record_fingerprint:
      contract.source_perspective_relay_record_fingerprint,
    source_next_work_signal_receipt_id:
      contract.source_next_work_signal_receipt_id,
    source_next_work_signal_record_id: contract.source_next_work_signal_record_id,
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
    writer_compatibility_label: mapping.writer_compatibility_label,
    writer_compatibility_rationale: mapping.writer_compatibility_rationale,
    state_application_label: mapping.state_application_label,
    state_application_rationale: mapping.state_application_rationale,
    adapter_label: mapping.adapter_label,
    adapter_rationale: mapping.adapter_rationale,
    mutation_label: mapping.mutation_label,
    mutation_rationale: mapping.mutation_rationale,
    apply_label: mapping.apply_label,
    apply_rationale: mapping.apply_rationale,
    canonical_update_label: mapping.canonical_update_label,
    canonical_update_rationale: mapping.canonical_update_rationale,
    relay_update_label: mapping.relay_update_label,
    relay_update_rationale: mapping.relay_update_rationale,
    recommended_next_work_label: mapping.recommended_next_work_label,
    outcome_label: mapping.outcome_label,
    outcome_signal: mapping.outcome_signal,
    intended_future_writer_target: mapping.intended_future_writer_target,
    default_future_writer_target: mapping.default_future_writer_target,
    writer_compatibility_scope_hint: candidate.writer_compatibility_scope_hint,
    writer_compatibility_strength_hint: candidate.writer_compatibility_strength_hint,
    manual_writer_compatibility_recommended_storage_path: writePath.recommended_storage_path,
    expected_future_write_scope: writePath.expected_future_write_scope,
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

function writerAuthorityBoundaryIsNarrow() {
  const boundary =
    getResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityWriteAuthorityBoundary();
  return (
    boundary.can_write_perspective_writer_compatibility_record === true &&
    boundary.can_write_perspective_writer_compatibility_receipt === true &&
    boundary.can_write_perspective_writer_compatibility_rollback_metadata === true &&
    boundary.can_call_existing_current_working_writer === false &&
    boundary.can_call_existing_canonical_state_writer === false &&
    boundary.can_update_current_working_perspective === false &&
    boundary.can_mutate_existing_canonical_perspective_state === false &&
    boundary.can_write_existing_canonical_perspective_state === false &&
    boundary.can_write_canonical_perspective_state === false &&
    boundary.can_promote_perspective === false &&
    boundary.can_write_perspective_memory === false &&
    boundary.can_mutate_perspective_state_application_record === false &&
    boundary.can_mutate_perspective_adapter_record === false &&
    boundary.can_mutate_perspective_state_mutation_record === false &&
    boundary.can_mutate_perspective_apply_record === false &&
    boundary.can_mutate_canonical_perspective_update_record === false &&
    boundary.can_mutate_perspective_relay === false &&
    boundary.can_mutate_next_work_bias === false &&
    boundary.can_mutate_work === false &&
    boundary.can_write_proof_or_evidence === false &&
    boundary.can_write_dogfood_metrics === false &&
    boundary.can_execute_product_write === false &&
    boundary.can_call_providers_or_openai === false &&
    boundary.can_call_github === false &&
    boundary.can_execute_codex === false &&
    boundary.can_fetch_sources === false &&
    boundary.can_run_retrieval_rag_embeddings_vector_fts_or_crawler === false &&
    boundary.persists_raw_manual_note_text === false &&
    boundary.persists_raw_result_report_text === false &&
    boundary.persists_operator_notes === false
  );
}

function sourceRefsPresent(
  contract: ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityContract,
) {
  return [
    contract.source_perspective_state_application_receipt_id,
    contract.source_perspective_state_application_record_id,
    contract.source_perspective_state_application_record_fingerprint,
    contract.source_perspective_adapter_receipt_id,
    contract.source_perspective_adapter_record_id,
    contract.source_perspective_adapter_record_fingerprint,
    contract.source_perspective_state_mutation_receipt_id,
    contract.source_perspective_state_mutation_record_id,
    contract.source_perspective_state_mutation_record_fingerprint,
    contract.source_perspective_apply_receipt_id,
    contract.source_perspective_apply_record_id,
    contract.source_perspective_apply_record_fingerprint,
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
  if (!isRecord(value)) return ["perspective_writer_compatibility_requested_side_effects_refused"];
  const requested = flattenObjectEntries(value);
  const forbidden = requested.some(([key, entryValue]) => {
    const text = `${key}:${String(entryValue)}`;
    const asksForMutation =
      entryValue === true ||
      entryValue === "true" ||
      /write|mutate|update|promote|execute|call|fetch|run|create/i.test(text);
    return asksForMutation && FORBIDDEN_SIDE_EFFECT_KEYS.some((pattern) => pattern.test(text));
  });
  return forbidden
    ? ["perspective_writer_compatibility_requested_side_effects_refused"]
    : [];
}

function rawTextFieldsAbsent(value: unknown): boolean {
  const stack = [value];
  while (stack.length > 0) {
    const current = stack.pop();
    if (Array.isArray(current)) {
      stack.push(...current);
      continue;
    }
    if (!isRecord(current)) continue;
    for (const [key, child] of Object.entries(current)) {
      if (RAW_TEXT_KEYS.has(key) && hasText(child)) return false;
      if (isRecord(child) || Array.isArray(child)) stack.push(child);
    }
  }
  return true;
}

function operatorNotesAbsentFromPersistedRequest(value: unknown): boolean {
  if (!isRecord(value)) return true;
  if (hasText(value.operator_note) || hasText(value.operator_notes)) return false;
  return true;
}

function explanatoryMaterialPresent(
  mapping: ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityContract["proposed_writer_compatibility_mapping"],
) {
  return (
    hasText(mapping.expected_summary) ||
    hasText(mapping.observed_summary) ||
    hasText(mapping.mismatch_or_gap_summary)
  );
}

function existingWriterCompatibilityClaimed(
  contract: ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityContract,
) {
  return (
    contract.existing_current_working_writer_compatibility
      .existing_current_working_perspective_update_contract_preview_compatible === true ||
    contract.existing_current_working_writer_compatibility
      .existing_current_working_perspective_update_contract_write_compatible === true ||
    contract.existing_current_working_writer_compatibility
      .existing_current_working_perspective_apply_preview_compatible === true ||
    contract.existing_current_working_writer_compatibility
      .existing_current_working_perspective_apply_write_compatible === true ||
    contract.existing_current_working_writer_compatibility
      .existing_route_integration_contract_compatible === true ||
    contract.existing_canonical_state_writer_compatibility
      .existing_canonical_perspective_state_writer_compatible === true ||
    contract.existing_canonical_state_writer_compatibility
      .existing_canonical_perspective_state_read_model_compatible === true ||
    contract.existing_canonical_state_writer_compatibility
      .existing_canonical_perspective_state_route_compatible === true
  );
}

function writeResultFlags(hasPerspectiveWriterCompatibilityRecord: boolean) {
  return {
    perspective_writer_compatibility_record_written: hasPerspectiveWriterCompatibilityRecord,
    existing_current_working_writer_called: false,
    existing_canonical_state_writer_called: false,
    current_working_perspective_updated: false,
    existing_canonical_perspective_state_table_mutated: false,
    canonical_perspective_state_written: false,
    perspective_promoted: false,
    perspective_memory_written: false,
    perspective_state_application_record_mutated: false,
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

function rollbackResultFlags(hasPerspectiveWriterCompatibilityRecord: boolean) {
  return {
    perspective_writer_compatibility_record_written: hasPerspectiveWriterCompatibilityRecord,
    existing_current_working_writer_called: false,
    existing_canonical_state_writer_called: false,
    current_working_perspective_updated: false,
    existing_canonical_perspective_state_table_mutated: false,
    canonical_perspective_state_written: false,
    perspective_promoted: false,
    perspective_memory_written: false,
    perspective_state_application_record_mutated: false,
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

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function uniqueStrings(values: unknown[]): string[] {
  return Array.from(
    new Set(
      values.filter(
        (value): value is string =>
          typeof value === "string" && value.length > 0,
      ),
    ),
  );
}

function flattenObjectEntries(value: unknown, prefix = ""): [string, unknown][] {
  if (!isRecord(value)) return [[prefix, value]];
  return Object.entries(value).flatMap(([key, child]) => {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    return isRecord(child)
      ? flattenObjectEntries(child, nextKey)
      : [[nextKey, child]];
  });
}

function fingerprint(value: unknown): string {
  return `${FINGERPRINT_ALGORITHM}:${fnv1a32(stableJson(value))}`;
}

function stableJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableJson(object[key])}`)
    .join(",")}}`;
}

function fnv1a32(input: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function getRunChangeCount(result: unknown): number {
  return isRecord(result) && typeof result.changes === "number"
    ? result.changes
    : 0;
}

function rollbackWriteTransaction(db: PerspectiveWriterCompatibilityDbLike) {
  try {
    db.prepare("ROLLBACK").run();
  } catch {
    // The write path is already returning a refusal; rollback failure adds no safe recovery.
  }
}
