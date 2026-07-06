import { openDatabase } from "@/lib/db";
import {
  ensureResearchCandidateManualResultRecordWriteSchema,
  getResearchCandidateManualResultWriteAuthorityBoundary,
  readResearchCandidateManualResultRecords,
  readResearchCandidateManualResultRecordsByReceiptId,
  type ResearchCandidateManualResultRecordDbLike,
} from "@/lib/research-candidate-review/read-manual-result-records";
import {
  RESEARCH_CANDIDATE_MANUAL_RESULT_AUTHORIZED_WRITE_CONFIRMATION,
  RESEARCH_CANDIDATE_MANUAL_RESULT_ROLLBACK_CONFIRMATION,
  type ResearchCandidateManualExpectedObservedDeltaRecord,
  type ResearchCandidateManualResultAuthorizedWriteRequest,
  type ResearchCandidateManualResultAuthorizedWriteResult,
  type ResearchCandidateManualResultRollbackRequest,
  type ResearchCandidateManualResultRollbackResult,
  type ResearchCandidateManualResultRollbackRecord,
  type ResearchCandidateManualResultWriteReceipt,
  type ResearchCandidateManualResultWriteValidation,
  type ResearchCandidateManualReuseOutcomeRecord,
} from "@/types/research-candidate-manual-result-authorized-record-write";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";

type JsonRecord = Record<string, unknown>;

const DEFAULT_SCOPE: ResearchCandidateReviewScope = "project:augnes";
const AUTHORITY_PROFILE =
  "manual_research_candidate_result_authorized_record_write.v0.1" as const;

const rawTextKeys = new Set([
  "manual_note_text",
  "raw_manual_note_text",
  "codex_result_report_text",
  "raw_result_report_text",
  "raw_result_text",
  "result_report_text",
  "raw_operator_notes",
]);

export function writeResearchCandidateManualResultAuthorizedRecords(
  request: unknown,
  options: { db?: ResearchCandidateManualResultRecordDbLike } = {},
): ResearchCandidateManualResultAuthorizedWriteResult {
  const validation = validateResearchCandidateManualResultAuthorizedWriteRequest(
    request,
  );
  const boundary = getResearchCandidateManualResultWriteAuthorityBoundary();
  if (!validation.passed || !isRecord(request)) {
    return {
      ok: false,
      result_status: "refused",
      validation,
      receipt: null,
      expected_observed_delta_record: null,
      reuse_outcome_record: null,
      readback: null,
      refusal_reasons: validation.failure_codes,
      duplicate_replayed: false,
      idempotency_key: validation.idempotency_key,
      authority_boundary: boundary,
    };
  }

  const typedRequest =
    request as unknown as ResearchCandidateManualResultAuthorizedWriteRequest;
  const db = options.db ?? openDatabase();
  const ownsDb = !options.db;

  try {
    ensureResearchCandidateManualResultRecordWriteSchema(db);
    const existingReadback = readResearchCandidateManualResultRecords({
      scope: typedRequest.result_intake.scope,
      idempotencyKey: validation.idempotency_key,
      limit: 1,
      db,
    });
    const existing = existingReadback.records_by_receipt[0];
    if (existing) {
      return {
        ok: true,
        result_status: "duplicate_replayed",
        validation,
        receipt: existing.receipt,
        expected_observed_delta_record: existing.expected_observed_delta_record,
        reuse_outcome_record: existing.reuse_outcome_record,
        readback: existingReadback,
        refusal_reasons: [],
        duplicate_replayed: true,
        idempotency_key: validation.idempotency_key,
        authority_boundary: boundary,
      };
    }

    if (
      typedRequest.operator_authorization.write_mode === "supersede_previous" &&
      !readResearchCandidateManualResultRecordsByReceiptId(
        typedRequest.operator_authorization.supersedes_receipt_id ?? "",
        { scope: typedRequest.result_intake.scope, db },
      )
    ) {
      return refusedResult({
        validation: {
          ...validation,
          passed: false,
          failure_codes: [
            ...validation.failure_codes,
            "supersedes_receipt_id_not_found",
          ],
        },
        idempotencyKey: validation.idempotency_key,
      });
    }

    const createdAt = new Date().toISOString();
    const receipt = buildReceipt({
      request: typedRequest,
      idempotencyKey: validation.idempotency_key!,
      createdAt,
    });
    const expectedObservedDeltaRecord = buildExpectedObservedDeltaRecord({
      request: typedRequest,
      receipt,
      createdAt,
    });
    const reuseOutcomeRecord = buildReuseOutcomeRecord({
      request: typedRequest,
      receipt,
      createdAt,
    });

    let transactionStarted = false;
    try {
      db.prepare("BEGIN IMMEDIATE").run();
      transactionStarted = true;
      if (typedRequest.operator_authorization.write_mode === "supersede_previous") {
        db.prepare(
          `
            UPDATE research_candidate_manual_result_write_receipts
            SET write_status = 'superseded'
            WHERE receipt_id = ?
              AND scope = ?
              AND write_status = 'committed'
          `,
        ).run(
          typedRequest.operator_authorization.supersedes_receipt_id,
          typedRequest.result_intake.scope,
        );
      }
      insertReceipt(db, receipt);
      insertExpectedObservedDeltaRecord(db, expectedObservedDeltaRecord);
      insertReuseOutcomeRecord(db, reuseOutcomeRecord);
      db.prepare("COMMIT").run();
      transactionStarted = false;
    } catch {
      if (transactionStarted) {
        try {
          db.prepare("ROLLBACK").run();
        } catch {
          // Refusal below covers rollback failure.
        }
      }
      return refusedResult({
        validation: {
          ...validation,
          passed: false,
          failure_codes: [...validation.failure_codes, "sqlite_transaction_failed"],
        },
        idempotencyKey: validation.idempotency_key,
      });
    }

    return {
      ok: true,
      result_status: "committed",
      validation,
      receipt,
      expected_observed_delta_record: expectedObservedDeltaRecord,
      reuse_outcome_record: reuseOutcomeRecord,
      readback: readResearchCandidateManualResultRecords({
        scope: typedRequest.result_intake.scope,
        receiptId: receipt.receipt_id,
        limit: 1,
        db,
      }),
      refusal_reasons: [],
      duplicate_replayed: false,
      idempotency_key: validation.idempotency_key,
      authority_boundary: boundary,
    };
  } finally {
    if (ownsDb && "close" in db && typeof db.close === "function") {
      db.close();
    }
  }
}

export function rollbackResearchCandidateManualResultWriteReceipt(
  request: unknown,
  options: { db?: ResearchCandidateManualResultRecordDbLike } = {},
): ResearchCandidateManualResultRollbackResult {
  const boundary = getResearchCandidateManualResultWriteAuthorityBoundary();
  const refusalReasons = validateRollbackRequest(request);
  if (refusalReasons.length > 0 || !isRecord(request)) {
    return {
      ok: false,
      result_status: "refused",
      rollback: null,
      receipt: null,
      readback: null,
      refusal_reasons: refusalReasons,
      authority_boundary: boundary,
    };
  }

  const typedRequest =
    request as unknown as ResearchCandidateManualResultRollbackRequest;
  const db = options.db ?? openDatabase();
  const ownsDb = !options.db;

  try {
    ensureResearchCandidateManualResultRecordWriteSchema(db);
    const existing = readResearchCandidateManualResultRecordsByReceiptId(
      typedRequest.receipt_id,
      { scope: DEFAULT_SCOPE, db },
    );
    if (!existing) {
      return {
        ok: false,
        result_status: "not_found",
        rollback: null,
        receipt: null,
        readback: readResearchCandidateManualResultRecords({ db }),
        refusal_reasons: ["receipt_not_found"],
        authority_boundary: boundary,
      };
    }
    if (existing.receipt.write_status === "rolled_back" && existing.rollback) {
      return {
        ok: true,
        result_status: "rolled_back",
        rollback: existing.rollback,
        receipt: existing.receipt,
        readback: readResearchCandidateManualResultRecords({
          receiptId: existing.receipt.receipt_id,
          db,
        }),
        refusal_reasons: [],
        authority_boundary: boundary,
      };
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
      db.prepare(
        `
          INSERT INTO research_candidate_manual_result_write_rollbacks (
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
      db.prepare(
        `
          UPDATE research_candidate_manual_result_write_receipts
          SET write_status = 'rolled_back',
              rollback_of_receipt_id = receipt_id,
              rollback_reason = ?
          WHERE receipt_id = ?
            AND scope = ?
        `,
      ).run(rollback.rollback_reason, typedRequest.receipt_id, DEFAULT_SCOPE);
      db.prepare("COMMIT").run();
      transactionStarted = false;
    } catch {
      if (transactionStarted) {
        try {
          db.prepare("ROLLBACK").run();
        } catch {
          // Refusal below covers rollback failure.
        }
      }
      return {
        ok: false,
        result_status: "refused",
        rollback: null,
        receipt: existing.receipt,
        readback: readResearchCandidateManualResultRecords({
          receiptId: existing.receipt.receipt_id,
          db,
        }),
        refusal_reasons: ["rollback_transaction_failed"],
        authority_boundary: boundary,
      };
    }

    const readback = readResearchCandidateManualResultRecords({
      receiptId: typedRequest.receipt_id,
      db,
    });
    return {
      ok: true,
      result_status: "rolled_back",
      rollback,
      receipt: readback.records_by_receipt[0]?.receipt ?? existing.receipt,
      readback,
      refusal_reasons: [],
      authority_boundary: boundary,
    };
  } finally {
    if (ownsDb && "close" in db && typeof db.close === "function") {
      db.close();
    }
  }
}

export function validateResearchCandidateManualResultAuthorizedWriteRequest(
  input: unknown,
): ResearchCandidateManualResultWriteValidation {
  const failureCodes: string[] = [];
  if (!isRecord(input)) {
    return validationResult({
      failureCodes: ["request_body_must_be_object"],
      idempotencyKey: null,
    });
  }
  if (containsRawTextField(input)) {
    failureCodes.push("raw_text_field_refused");
  }

  const request = input as Partial<ResearchCandidateManualResultAuthorizedWriteRequest>;
  const resultIntake = isRecord(request.result_intake)
    ? request.result_intake
    : null;
  const operatorReview = isRecord(request.operator_review)
    ? request.operator_review
    : null;
  const contractPreview = isRecord(request.record_contract_preview)
    ? request.record_contract_preview
    : null;
  const operatorAuthorization = isRecord(request.operator_authorization)
    ? request.operator_authorization
    : null;

  if (!resultIntake) failureCodes.push("result_intake_missing");
  if (!operatorReview) failureCodes.push("operator_review_missing");
  if (!contractPreview) failureCodes.push("record_contract_preview_missing");
  if (!operatorAuthorization) failureCodes.push("operator_authorization_missing");

  if (resultIntake) {
    if (
      resultIntake.intake_kind !==
      "research_candidate_manual_note_handoff_result_intake"
    ) {
      failureCodes.push("result_intake_kind_invalid");
    }
    if (resultIntake.scope !== DEFAULT_SCOPE) {
      failureCodes.push("unsupported_scope");
    }
    if (getNested(resultIntake, ["validation", "passed"]) !== true) {
      failureCodes.push("result_intake_validation_not_passed");
    }
    if (resultIntake.recommendation_status !== "ready_for_operator_review") {
      failureCodes.push("result_intake_not_ready_for_operator_review");
    }
  }

  if (operatorReview) {
    if (
      operatorReview.review_kind !==
      "research_candidate_manual_note_result_intake_operator_review"
    ) {
      failureCodes.push("operator_review_kind_invalid");
    }
    if (
      operatorReview.selected_operator_decision !==
      "prepare_record_contract_preview"
    ) {
      failureCodes.push("operator_review_decision_not_prepare_record_contract");
    }
    if (
      operatorReview.review_status !== "ready_for_record_contract_preview"
    ) {
      failureCodes.push("operator_review_not_ready_for_record_contract");
    }
    if (
      getNested(operatorReview, [
        "validation",
        "record_contract_preview_allowed",
      ]) !== true
    ) {
      failureCodes.push("operator_review_does_not_allow_contract_preview");
    }
    if (!operatorReviewAuthoritySafe(operatorReview.authority_boundary)) {
      failureCodes.push("operator_review_authority_boundary_invalid");
    }
  }

  if (contractPreview) {
    if (
      contractPreview.contract_kind !==
      "research_candidate_manual_note_result_record_contract_preview"
    ) {
      failureCodes.push("record_contract_preview_kind_invalid");
    }
    if (contractPreview.contract_status !== "ready_for_future_authorization") {
      failureCodes.push("record_contract_preview_not_ready");
    }
    if (getNested(contractPreview, ["validation", "passed"]) !== true) {
      failureCodes.push("record_contract_preview_validation_not_passed");
    }
    if (
      contractPreview.would_write !== false ||
      contractPreview.storage_authority_present !== false ||
      contractPreview.record_write_authorized !== false ||
      contractPreview.writes_ledger !== false
    ) {
      failureCodes.push("preview_contract_write_flags_not_false");
    }
    if (
      !Array.isArray(contractPreview.evidence_refs) ||
      contractPreview.evidence_refs.length !== 0 ||
      !Array.isArray(contractPreview.proof_refs) ||
      contractPreview.proof_refs.length !== 0
    ) {
      failureCodes.push("preview_contract_proof_or_evidence_refs_not_empty");
    }
    if (!contractPreviewAuthoritySafe(contractPreview.authority_boundary)) {
      failureCodes.push("record_contract_authority_boundary_invalid");
    }
  }

  if (resultIntake && operatorReview && contractPreview) {
    if (
      operatorReview.source_handoff_seed_fingerprint !==
      resultIntake.source_handoff_seed_fingerprint
    ) {
      failureCodes.push("operator_review_seed_fingerprint_mismatch");
    }
    if (
      contractPreview.source_handoff_seed_fingerprint !==
      resultIntake.source_handoff_seed_fingerprint
    ) {
      failureCodes.push("record_contract_seed_fingerprint_mismatch");
    }
    if (
      contractPreview.source_operator_review_fingerprint !==
      operatorReview.review_fingerprint
    ) {
      failureCodes.push("record_contract_operator_review_fingerprint_mismatch");
    }
    if (
      contractPreview.source_result_intake_fingerprint !==
      operatorReview.source_result_intake_fingerprint
    ) {
      failureCodes.push("record_contract_result_intake_fingerprint_mismatch");
    }
  }

  if (operatorAuthorization) {
    if (
      operatorAuthorization.authorization_kind !==
      "manual_operator_authorized_record_write"
    ) {
      failureCodes.push("operator_authorization_kind_invalid");
    }
    if (
      operatorAuthorization.operator_confirmation_text !==
      RESEARCH_CANDIDATE_MANUAL_RESULT_AUTHORIZED_WRITE_CONFIRMATION
    ) {
      failureCodes.push("operator_confirmation_text_mismatch");
    }
    if (
      !["commit", "replay_if_duplicate", "supersede_previous"].includes(
        String(operatorAuthorization.write_mode),
      )
    ) {
      failureCodes.push("write_mode_invalid");
    }
    if (
      operatorAuthorization.write_mode === "supersede_previous" &&
      typeof operatorAuthorization.supersedes_receipt_id !== "string"
    ) {
      failureCodes.push("supersedes_receipt_id_required");
    }
  }

  const idempotencyKey =
    resultIntake && operatorReview && contractPreview
      ? createResearchCandidateManualResultIdempotencyKey({
          resultIntake,
          operatorReview,
          contractPreview,
        })
      : null;

  return validationResult({
    failureCodes,
    idempotencyKey,
    exactConfirmationPresent:
      operatorAuthorization?.operator_confirmation_text ===
      RESEARCH_CANDIDATE_MANUAL_RESULT_AUTHORIZED_WRITE_CONFIRMATION,
    readyOperatorReviewPresent:
      operatorReview?.review_status === "ready_for_record_contract_preview",
    readyContractPreviewPresent:
      contractPreview?.contract_status === "ready_for_future_authorization",
    previewContractRemainedNonWriting:
      contractPreview?.would_write === false &&
      contractPreview?.record_write_authorized === false,
    rawTextFieldsAbsent: !containsRawTextField(input),
  });
}

export function createResearchCandidateManualResultIdempotencyKey({
  resultIntake,
  operatorReview,
  contractPreview,
}: {
  resultIntake: JsonRecord;
  operatorReview: JsonRecord;
  contractPreview: JsonRecord;
}) {
  const eod = getRecord(
    contractPreview,
    "expected_observed_delta_record_candidate",
  );
  const reuse = getRecord(contractPreview, "reuse_outcome_record_candidate");
  return `manual-result-record-write:${fingerprint({
    source_handoff_seed_fingerprint: resultIntake.source_handoff_seed_fingerprint,
    source_result_text_fingerprint: resultIntake.result_text_fingerprint,
    source_operator_review_fingerprint: operatorReview.review_fingerprint,
    selected_candidate_context_refs:
      reuse?.selected_candidate_context_refs ?? [],
    expected_summary: eod?.expected_summary ?? "",
    observed_summary: eod?.observed_summary ?? null,
    mismatch_or_gap_summary: eod?.mismatch_or_gap_summary ?? "",
    reuse_outcome_label: reuse?.outcome_label ?? "",
  })}`;
}

function buildReceipt({
  request,
  idempotencyKey,
  createdAt,
}: {
  request: ResearchCandidateManualResultAuthorizedWriteRequest;
  idempotencyKey: string;
  createdAt: string;
}): ResearchCandidateManualResultWriteReceipt {
  const base = {
    created_at: createdAt,
    scope: request.result_intake.scope,
    source_preview_session_id: request.result_intake.source_preview_session_id,
    source_handoff_seed_fingerprint:
      request.result_intake.source_handoff_seed_fingerprint,
    source_result_intake_ref:
      request.record_contract_preview.source_result_intake_ref,
    source_result_intake_fingerprint:
      request.record_contract_preview.source_result_intake_fingerprint,
    source_operator_review_ref: request.operator_review.review_ref,
    source_operator_review_fingerprint: request.operator_review.review_fingerprint,
    source_record_contract_ref: request.record_contract_preview.contract_ref,
    source_record_contract_fingerprint:
      request.record_contract_preview.contract_fingerprint,
    idempotency_key: idempotencyKey,
    write_status: "committed" as const,
    operator_decision: request.operator_review.selected_operator_decision,
    authority_profile: AUTHORITY_PROFILE,
    supersedes_receipt_id:
      request.operator_authorization.write_mode === "supersede_previous"
        ? request.operator_authorization.supersedes_receipt_id ?? null
        : null,
    rollback_of_receipt_id: null,
    rollback_reason: null,
  };
  const receiptId = `manual-result-receipt:${fingerprint({
    idempotency_key: idempotencyKey,
    source_record_contract_fingerprint: base.source_record_contract_fingerprint,
  })}`;
  return {
    receipt_id: receiptId,
    ...base,
    receipt_fingerprint: fingerprint({
      receipt_id: receiptId,
      ...base,
    }),
  };
}

function buildExpectedObservedDeltaRecord({
  request,
  receipt,
  createdAt,
}: {
  request: ResearchCandidateManualResultAuthorizedWriteRequest;
  receipt: ResearchCandidateManualResultWriteReceipt;
  createdAt: string;
}): ResearchCandidateManualExpectedObservedDeltaRecord {
  const candidate =
    request.record_contract_preview.expected_observed_delta_record_candidate;
  const recordBase = {
    receipt_id: receipt.receipt_id,
    created_at: createdAt,
    scope: request.result_intake.scope,
    expected_summary: candidate.expected_summary,
    observed_summary: candidate.observed_summary,
    mismatch_or_gap_summary: candidate.mismatch_or_gap_summary,
    source_handoff_seed_fingerprint: candidate.source_handoff_seed_fingerprint,
    source_result_text_fingerprint: candidate.source_result_text_fingerprint,
    source_preview_session_id: candidate.source_preview_session_id,
    source_refs: uniqueSorted(candidate.source_refs),
    authority_profile: AUTHORITY_PROFILE,
  };
  const recordId = `manual-eod-record:${fingerprint({
    receipt_id: receipt.receipt_id,
    source_result_text_fingerprint: candidate.source_result_text_fingerprint,
  })}`;
  return {
    record_id: recordId,
    ...recordBase,
    record_fingerprint: fingerprint({ record_id: recordId, ...recordBase }),
  };
}

function buildReuseOutcomeRecord({
  request,
  receipt,
  createdAt,
}: {
  request: ResearchCandidateManualResultAuthorizedWriteRequest;
  receipt: ResearchCandidateManualResultWriteReceipt;
  createdAt: string;
}): ResearchCandidateManualReuseOutcomeRecord {
  const candidate = request.record_contract_preview.reuse_outcome_record_candidate;
  const recordBase = {
    receipt_id: receipt.receipt_id,
    created_at: createdAt,
    scope: request.result_intake.scope,
    outcome_label: candidate.outcome_label,
    selected_candidate_context_refs: uniqueSorted(
      candidate.selected_candidate_context_refs,
    ),
    source_line: candidate.source_line,
    warning_reasons: uniqueSorted(candidate.warning_reasons),
    source_handoff_seed_fingerprint: candidate.source_handoff_seed_fingerprint,
    source_result_text_fingerprint: candidate.source_result_text_fingerprint,
    source_preview_session_id: request.result_intake.source_preview_session_id,
    authority_profile: AUTHORITY_PROFILE,
    writes_ledger: false as const,
  };
  const recordId = `manual-reuse-record:${fingerprint({
    receipt_id: receipt.receipt_id,
    source_result_text_fingerprint: candidate.source_result_text_fingerprint,
  })}`;
  return {
    record_id: recordId,
    ...recordBase,
    record_fingerprint: fingerprint({ record_id: recordId, ...recordBase }),
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
}): ResearchCandidateManualResultRollbackRecord {
  const rollbackId = `manual-result-rollback:${fingerprint({
    receipt_id: receiptId,
    rollback_reason: rollbackReason,
  })}`;
  return {
    rollback_id: rollbackId,
    created_at: createdAt,
    receipt_id: receiptId,
    rollback_reason: rollbackReason.trim().slice(0, 1000),
    authority_profile: AUTHORITY_PROFILE,
    rollback_fingerprint: fingerprint({
      rollback_id: rollbackId,
      receipt_id: receiptId,
      rollback_reason: rollbackReason.trim().slice(0, 1000),
      authority_profile: AUTHORITY_PROFILE,
    }),
  };
}

function insertReceipt(
  db: ResearchCandidateManualResultRecordDbLike,
  receipt: ResearchCandidateManualResultWriteReceipt,
) {
  db.prepare(
    `
      INSERT INTO research_candidate_manual_result_write_receipts (
        receipt_id,
        created_at,
        scope,
        source_preview_session_id,
        source_handoff_seed_fingerprint,
        source_result_intake_ref,
        source_result_intake_fingerprint,
        source_operator_review_ref,
        source_operator_review_fingerprint,
        source_record_contract_ref,
        source_record_contract_fingerprint,
        idempotency_key,
        write_status,
        operator_decision,
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
        @source_preview_session_id,
        @source_handoff_seed_fingerprint,
        @source_result_intake_ref,
        @source_result_intake_fingerprint,
        @source_operator_review_ref,
        @source_operator_review_fingerprint,
        @source_record_contract_ref,
        @source_record_contract_fingerprint,
        @idempotency_key,
        @write_status,
        @operator_decision,
        @authority_profile,
        @receipt_fingerprint,
        @supersedes_receipt_id,
        @rollback_of_receipt_id,
        @rollback_reason
      )
    `,
  ).run(receipt);
}

function insertExpectedObservedDeltaRecord(
  db: ResearchCandidateManualResultRecordDbLike,
  record: ResearchCandidateManualExpectedObservedDeltaRecord,
) {
  db.prepare(
    `
      INSERT INTO research_candidate_manual_expected_observed_delta_records (
        record_id,
        receipt_id,
        created_at,
        scope,
        expected_summary,
        observed_summary,
        mismatch_or_gap_summary,
        source_handoff_seed_fingerprint,
        source_result_text_fingerprint,
        source_preview_session_id,
        source_refs_json,
        authority_profile,
        record_fingerprint
      )
      VALUES (
        @record_id,
        @receipt_id,
        @created_at,
        @scope,
        @expected_summary,
        @observed_summary,
        @mismatch_or_gap_summary,
        @source_handoff_seed_fingerprint,
        @source_result_text_fingerprint,
        @source_preview_session_id,
        @source_refs_json,
        @authority_profile,
        @record_fingerprint
      )
    `,
  ).run({
    ...record,
    source_refs_json: JSON.stringify(record.source_refs),
  });
}

function insertReuseOutcomeRecord(
  db: ResearchCandidateManualResultRecordDbLike,
  record: ResearchCandidateManualReuseOutcomeRecord,
) {
  db.prepare(
    `
      INSERT INTO research_candidate_manual_reuse_outcome_records (
        record_id,
        receipt_id,
        created_at,
        scope,
        outcome_label,
        selected_candidate_context_refs_json,
        source_line,
        warning_reasons_json,
        source_handoff_seed_fingerprint,
        source_result_text_fingerprint,
        source_preview_session_id,
        authority_profile,
        record_fingerprint
      )
      VALUES (
        @record_id,
        @receipt_id,
        @created_at,
        @scope,
        @outcome_label,
        @selected_candidate_context_refs_json,
        @source_line,
        @warning_reasons_json,
        @source_handoff_seed_fingerprint,
        @source_result_text_fingerprint,
        @source_preview_session_id,
        @authority_profile,
        @record_fingerprint
      )
    `,
  ).run({
    ...record,
    selected_candidate_context_refs_json: JSON.stringify(
      record.selected_candidate_context_refs,
    ),
    warning_reasons_json: JSON.stringify(record.warning_reasons),
  });
}

function validateRollbackRequest(input: unknown): string[] {
  const reasons: string[] = [];
  if (!isRecord(input)) return ["request_body_must_be_object"];
  if (containsRawTextField(input)) reasons.push("raw_text_field_refused");
  if (typeof input.receipt_id !== "string" || input.receipt_id.trim().length === 0) {
    reasons.push("receipt_id_missing");
  }
  const authorization = getRecord(input, "rollback_authorization");
  if (!authorization) {
    reasons.push("rollback_authorization_missing");
    return reasons;
  }
  if (
    authorization.authorization_kind !==
    "manual_operator_authorized_record_rollback"
  ) {
    reasons.push("rollback_authorization_kind_invalid");
  }
  if (
    authorization.operator_confirmation_text !==
    RESEARCH_CANDIDATE_MANUAL_RESULT_ROLLBACK_CONFIRMATION
  ) {
    reasons.push("rollback_confirmation_text_mismatch");
  }
  if (
    typeof authorization.rollback_reason !== "string" ||
    authorization.rollback_reason.trim().length === 0
  ) {
    reasons.push("rollback_reason_missing");
  }
  return uniqueSorted(reasons);
}

function refusedResult({
  validation,
  idempotencyKey,
}: {
  validation: ResearchCandidateManualResultWriteValidation;
  idempotencyKey: string | null;
}): ResearchCandidateManualResultAuthorizedWriteResult {
  return {
    ok: false,
    result_status: "refused",
    validation,
    receipt: null,
    expected_observed_delta_record: null,
    reuse_outcome_record: null,
    readback: null,
    refusal_reasons: validation.failure_codes,
    duplicate_replayed: false,
    idempotency_key: idempotencyKey,
    authority_boundary: getResearchCandidateManualResultWriteAuthorityBoundary(),
  };
}

function validationResult({
  failureCodes,
  idempotencyKey,
  exactConfirmationPresent = false,
  readyOperatorReviewPresent = false,
  readyContractPreviewPresent = false,
  previewContractRemainedNonWriting = false,
  rawTextFieldsAbsent = false,
}: {
  failureCodes: string[];
  idempotencyKey: string | null;
  exactConfirmationPresent?: boolean;
  readyOperatorReviewPresent?: boolean;
  readyContractPreviewPresent?: boolean;
  previewContractRemainedNonWriting?: boolean;
  rawTextFieldsAbsent?: boolean;
}): ResearchCandidateManualResultWriteValidation {
  const authorityBoundary = getResearchCandidateManualResultWriteAuthorityBoundary();
  return {
    passed: failureCodes.length === 0 && Boolean(idempotencyKey),
    failure_codes: uniqueSorted(failureCodes),
    idempotency_key: idempotencyKey,
    exact_operator_confirmation_present: exactConfirmationPresent,
    storage_authority_present: exactConfirmationPresent,
    ready_operator_review_present: readyOperatorReviewPresent,
    ready_contract_preview_present: readyContractPreviewPresent,
    preview_contract_remained_non_writing: previewContractRemainedNonWriting,
    raw_text_fields_absent: rawTextFieldsAbsent,
    authority_boundary_safe: writeAuthorityBoundarySafe(authorityBoundary),
  };
}

function writeAuthorityBoundarySafe(
  boundary: ReturnType<
    typeof getResearchCandidateManualResultWriteAuthorityBoundary
  >,
) {
  const allowedTrue = new Set([
    "can_write_manual_expected_observed_delta_record",
    "can_write_manual_reuse_outcome_record",
    "can_write_manual_result_write_receipt",
    "can_write_manual_result_rollback_metadata",
  ]);
  return Object.entries(boundary).every(([key, value]) =>
    allowedTrue.has(key) ? value === true : value === false,
  );
}

function operatorReviewAuthoritySafe(value: unknown) {
  if (!isRecord(value)) return false;
  const requiredTrue = new Set(["candidate_only", "preview_only", "local_review_only"]);
  return Object.entries(value).every(([key, boundaryValue]) =>
    requiredTrue.has(key) ? boundaryValue === true : boundaryValue === false,
  );
}

function contractPreviewAuthoritySafe(value: unknown) {
  if (!isRecord(value)) return false;
  const requiredTrue = new Set([
    "candidate_only",
    "preview_only",
    "contract_preview_only",
  ]);
  return Object.entries(value).every(([key, boundaryValue]) =>
    requiredTrue.has(key) ? boundaryValue === true : boundaryValue === false,
  );
}

function containsRawTextField(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsRawTextField);
  if (!isRecord(value)) return false;
  return Object.entries(value).some(([key, child]) => {
    const normalized = key.toLowerCase();
    return rawTextKeys.has(normalized) || containsRawTextField(child);
  });
}

function getRecord(value: unknown, key: string): JsonRecord | null {
  if (!isRecord(value)) return null;
  const child = value[key];
  return isRecord(child) ? child : null;
}

function getNested(value: unknown, path: string[]) {
  let current = value;
  for (const key of path) {
    if (!isRecord(current)) return undefined;
    current = current[key];
  }
  return current;
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function fingerprint(value: unknown) {
  return `fnv1a32:${fnv1a32(stableJson(value))}`;
}

function stableJson(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableJson(item)).join(",")}]`;
  }

  const record = value as JsonRecord;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
    .join(",")}}`;
}

function uniqueSorted(values: readonly string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort();
}

function fnv1a32(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
