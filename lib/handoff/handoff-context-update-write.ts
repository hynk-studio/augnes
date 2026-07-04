import { createHash } from "node:crypto";

import {
  HANDOFF_CONTEXT_UPDATE_OPERATOR_DECISION_PREVIEW_VERSION,
  type HandoffContextUpdateOperatorDecisionPreview,
} from "@/types/handoff-context-update-operator-decision-preview";
import type { HandoffContextUpdateCandidate } from "@/types/handoff-context-update-preview";
import {
  OPERATOR_APPROVED_HANDOFF_CONTEXT_UPDATE_RECORD_VERSION,
  OPERATOR_APPROVED_HANDOFF_CONTEXT_UPDATE_SCOPE,
  OPERATOR_APPROVED_HANDOFF_CONTEXT_UPDATE_STORE_VERSION,
  OPERATOR_APPROVED_HANDOFF_CONTEXT_UPDATE_WRITE_RECEIPT_VERSION,
  type OperatorApprovedHandoffContextUpdateApprovedCandidateMaterial,
  type OperatorApprovedHandoffContextUpdateAuthorityBoundary,
  type OperatorApprovedHandoffContextUpdateCarryForwardMaterial,
  type OperatorApprovedHandoffContextUpdateNoSideEffects,
  type OperatorApprovedHandoffContextUpdateOperatorApproval,
  type OperatorApprovedHandoffContextUpdateRecord,
  type OperatorApprovedHandoffContextUpdateStoreResult,
  type OperatorApprovedHandoffContextUpdateWriteInput,
  type OperatorApprovedHandoffContextUpdateWriteReceipt,
  type OperatorApprovedHandoffContextUpdateWriteStatus,
} from "@/types/handoff-context-update-write";

export const HANDOFF_CONTEXT_UPDATE_WRITE_TABLE =
  "handoff_context_update_records" as const;

export interface HandoffContextUpdateWriteDbLike {
  exec(sql: string): unknown;
  prepare(sql: string): {
    run(...params: unknown[]): unknown;
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  };
}

export interface HandoffContextUpdateWriteListOptions {
  idempotency_key?: string;
  operator_ref?: string;
  limit?: number;
}

interface HandoffContextUpdateWriteRow {
  record_id: string;
  idempotency_key: string;
  created_at: string;
  scope: string;
  operator_ref: string;
  record_fingerprint: string;
  record_json: string;
  receipt_json: string;
}

interface ValidationResult {
  ok: boolean;
  refusal_reasons: string[];
  input: OperatorApprovedHandoffContextUpdateWriteInput | null;
  decision_preview: HandoffContextUpdateOperatorDecisionPreview | null;
  idempotency_key: string | null;
  operator_approval: OperatorApprovedHandoffContextUpdateOperatorApproval | null;
}

const previewForbiddenAuthorityFields = [
  "can_persist_decision",
  "can_write_db",
  "can_write_handoff_context",
  "can_write_selected_refs",
  "can_send_handoff",
  "can_write_continuity_relay",
  "can_update_current_working_perspective",
  "can_write_perspective_unit",
  "can_write_next_work_bias",
  "can_write_memory",
  "can_mutate_memory",
  "can_promote_memory",
  "can_apply_project_perspective",
  "can_create_promotion_decision",
  "can_create_formation_receipt",
  "can_write_dogfood_metrics",
  "can_update_metrics",
  "can_write_dogfood_ledger",
  "can_call_provider_openai",
  "can_call_github",
  "can_execute_codex",
  "can_create_pr",
  "can_merge_pr",
  "can_run_autonomous_action",
  "can_create_graph_or_vector_store",
  "can_create_rag_stack",
  "can_crawl_or_observe_browser",
] as const;

const forbiddenSideEffectKeyPatterns = [
  /persist.*general.*operator.*decision/i,
  /mutate.*live.*handoff/i,
  /handoff.*context(?!.*update.*record)/i,
  /selected.*refs.*live/i,
  /write.*selected.*refs/i,
  /send.*handoff/i,
  /handoff.*send/i,
  /continuity.*relay/i,
  /current.*working.*perspective/i,
  /\bcwp\b/i,
  /perspective.*unit/i,
  /next.*work.*bias/i,
  /memory/i,
  /dogfood.*metrics/i,
  /update.*metrics/i,
  /reuse.*ledger/i,
  /provider/i,
  /openai/i,
  /github/i,
  /execute.*codex/i,
  /codex.*execut/i,
  /\bpr\b.*create/i,
  /create.*pr/i,
  /\bpr\b.*merge/i,
  /merge.*pr/i,
  /autonomous/i,
  /graph/i,
  /vector/i,
  /\brag\b/i,
  /crawler/i,
  /browser.*observer/i,
] as const;

const allowedRequestedSideEffectKeys = new Set([
  "can_write_db",
  "can_write_handoff_context_update_record",
  "can_write_operator_approved_handoff_context_update_record",
]);

const sampleDefaultOrSmokeMarkers = [
  "sample",
  "fixture",
  "smoke",
  "workbench:default",
  "default_handoff_context_update",
  "default-workbench",
] as const;

const privateRefMarkers = [
  "/users/",
  "\\users\\",
  "/home/",
  "\\home\\",
  "/private/",
  "/volumes/",
  "file://",
  ".env",
  "openai_api_key",
  "github_token",
  "password:",
  "secret:",
  "token:",
  "bearer ",
  "sk-",
  "ghp_",
  "github_pat_",
  "xoxb-",
] as const;

export const handoffContextUpdateWriteSchemaSqlV01 = `
CREATE TABLE IF NOT EXISTS handoff_context_update_records (
  record_id TEXT PRIMARY KEY,
  idempotency_key TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL,
  scope TEXT NOT NULL,
  operator_ref TEXT NOT NULL,
  record_fingerprint TEXT NOT NULL,
  record_json TEXT NOT NULL,
  receipt_json TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_handoff_context_update_records_scope_created
  ON handoff_context_update_records(scope, created_at, record_id);

CREATE INDEX IF NOT EXISTS idx_handoff_context_update_records_operator
  ON handoff_context_update_records(scope, operator_ref, created_at, record_id);
`;

export function ensureHandoffContextUpdateWriteSchemaV01(
  db: HandoffContextUpdateWriteDbLike,
): void {
  db.exec(handoffContextUpdateWriteSchemaSqlV01);
}

export function handoffContextUpdateWriteSchemaExistsV01(
  db: HandoffContextUpdateWriteDbLike,
): boolean {
  const row = db
    .prepare(
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name = ?`,
    )
    .get(HANDOFF_CONTEXT_UPDATE_WRITE_TABLE) as { name?: string } | undefined;
  return row?.name === HANDOFF_CONTEXT_UPDATE_WRITE_TABLE;
}

export function validateOperatorApprovedHandoffContextUpdateWriteInputV01(
  input: unknown,
): ValidationResult {
  const reasons: string[] = [];
  if (!isRecord(input)) {
    return validationResult({
      refusal_reasons: ["input_must_be_object"],
      input: null,
      decision_preview: null,
      idempotency_key: null,
      operator_approval: null,
    });
  }

  const idempotencyKey = asNonEmptyString(input.idempotency_key);
  if (!idempotencyKey || !isSafePublicRef(idempotencyKey)) {
    reasons.push("idempotency_key_missing_or_invalid");
  }

  const decisionPreviewRecord = getRecord(input, "decision_preview");
  const decisionPreview = decisionPreviewRecord
    ? (decisionPreviewRecord as unknown as HandoffContextUpdateOperatorDecisionPreview)
    : null;
  if (!decisionPreviewRecord) {
    reasons.push("decision_preview_missing");
  } else if (
    decisionPreviewRecord.preview_version !==
    HANDOFF_CONTEXT_UPDATE_OPERATOR_DECISION_PREVIEW_VERSION
  ) {
    reasons.push("decision_preview_version_invalid");
  }

  validateDecisionPreviewShapeV01(decisionPreviewRecord, reasons);
  validateDecisionPreviewReadinessV01(decisionPreviewRecord, reasons);

  const operatorApprovalRecord = getRecord(input, "operator_approval");
  if (!operatorApprovalRecord) {
    reasons.push("operator_approval_missing");
  }
  if (operatorApprovalRecord?.operator_decision !== "approve_for_future_write") {
    reasons.push("operator_approval_decision_not_approve_for_future_write");
  }
  const approvedBy = asSafePublicRef(operatorApprovalRecord?.approved_by);
  const operatorRef = asSafePublicRef(operatorApprovalRecord?.operator_ref);
  if (!approvedBy) reasons.push("approved_by_missing_or_invalid");
  if (!operatorRef) reasons.push("operator_ref_missing_or_invalid");
  const approvedAt = asNonEmptyString(operatorApprovalRecord?.approved_at);
  if (!approvedAt || !Number.isFinite(Date.parse(approvedAt))) {
    reasons.push("approved_at_missing_or_invalid");
  }
  const approvalStatement = asCleanStatement(
    operatorApprovalRecord?.approval_statement,
  );
  if (!approvalStatement) reasons.push("approval_statement_missing_or_invalid");

  const checklistConfirmations = getRecord(
    operatorApprovalRecord,
    "checklist_confirmations",
  );
  if (!checklistConfirmations) {
    reasons.push("checklist_confirmations_missing");
  }
  const approvalRequirements = stringsFromArray(
    decisionPreviewRecord?.approval_requirements,
  );
  if (decisionPreviewRecord && approvalRequirements.length === 0) {
    reasons.push("approval_requirements_missing_or_invalid");
  }
  for (const requirement of approvalRequirements) {
    if (checklistConfirmations?.[requirement] !== true) {
      reasons.push(`checklist_confirmation_missing:${requirement}`);
    }
  }

  const unsafeRefs = collectUnsafePublicRefs(decisionPreviewRecord);
  for (const ref of unsafeRefs) {
    reasons.push(`public_ref_unsafe:${ref.path}`);
  }

  if (containsSampleDefaultOrSmokeMaterial(input)) {
    reasons.push("sample_fixture_default_or_smoke_material_refused");
  }
  if (isDefaultWorkbenchMissingOrInsufficientMaterial(decisionPreviewRecord)) {
    reasons.push("default_workbench_missing_or_insufficient_material_refused");
  }

  reasons.push(...findRequestedSideEffectRefusals(input.requested_side_effects));
  reasons.push(...findForbiddenActionRequests(input));

  return validationResult({
    refusal_reasons: uniqueSortedStrings(reasons),
    input:
      reasons.length === 0
        ? (input as unknown as OperatorApprovedHandoffContextUpdateWriteInput)
        : null,
    decision_preview: decisionPreview,
    idempotency_key: idempotencyKey,
    operator_approval:
      approvedBy && operatorRef && approvedAt && approvalStatement
        ? {
            approved_by: approvedBy,
            operator_ref: operatorRef,
            approved_at: approvedAt,
            approval_statement: approvalStatement,
            checklist_confirmations:
              checklistConfirmations as OperatorApprovedHandoffContextUpdateOperatorApproval["checklist_confirmations"],
          }
        : null,
  });
}

export function writeOperatorApprovedHandoffContextUpdateV01(
  input: unknown,
  options: { db: HandoffContextUpdateWriteDbLike },
): OperatorApprovedHandoffContextUpdateStoreResult {
  const validation =
    validateOperatorApprovedHandoffContextUpdateWriteInputV01(input);
  if (
    !validation.ok ||
    !validation.input ||
    !validation.decision_preview ||
    !validation.idempotency_key ||
    !validation.operator_approval
  ) {
    return storeResult(
      "refused",
      null,
      [],
      createReceipt({
        validation,
        wrote: false,
        refused: true,
        idempotentReplay: false,
        record: null,
      }),
    );
  }

  ensureHandoffContextUpdateWriteSchemaV01(options.db);
  const record = buildHandoffContextUpdateRecord(validation as ValidationResult & {
    ok: true;
    input: OperatorApprovedHandoffContextUpdateWriteInput;
    decision_preview: HandoffContextUpdateOperatorDecisionPreview;
    idempotency_key: string;
    operator_approval: OperatorApprovedHandoffContextUpdateOperatorApproval;
  });
  const existing = readHandoffContextUpdateRecordByIdempotencyKeyV01(
    record.idempotency_key,
    { db: options.db },
  ).record;
  if (existing) {
    if (existing.record_fingerprint === record.record_fingerprint) {
      return storeResult(
        "idempotent_existing",
        existing,
        [existing],
        createReceipt({
          validation,
          wrote: false,
          refused: false,
          idempotentReplay: true,
          record: existing,
        }),
      );
    }
    return storeResult(
      "refused",
      existing,
      [existing],
      createReceipt({
        validation: {
          ...validation,
          ok: false,
          refusal_reasons: ["idempotency_key_conflict"],
        },
        wrote: false,
        refused: true,
        idempotentReplay: false,
        record: existing,
      }),
    );
  }

  const receipt = createReceipt({
    validation,
    wrote: true,
    refused: false,
    idempotentReplay: false,
    record,
  });

  let transactionStarted = false;
  try {
    options.db.prepare("BEGIN IMMEDIATE").run();
    transactionStarted = true;
    options.db
      .prepare(
        `INSERT INTO handoff_context_update_records (
          record_id,
          idempotency_key,
          created_at,
          scope,
          operator_ref,
          record_fingerprint,
          record_json,
          receipt_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        record.record_id,
        record.idempotency_key,
        record.created_at,
        record.scope,
        record.operator_approval.operator_ref,
        record.record_fingerprint,
        JSON.stringify(record),
        JSON.stringify(receipt),
      );
    options.db.prepare("COMMIT").run();
    transactionStarted = false;
    return storeResult("written", record, [record], receipt);
  } catch {
    if (transactionStarted) {
      try {
        options.db.prepare("ROLLBACK").run();
      } catch {
        // Rollback failure still returns a bounded refusal receipt.
      }
    }
    return storeResult(
      "refused",
      null,
      [],
      createReceipt({
        validation: {
          ...validation,
          ok: false,
          refusal_reasons: ["sqlite_insert_failed"],
        },
        wrote: false,
        refused: true,
        idempotentReplay: false,
        record: null,
      }),
    );
  }
}

export function refuseOperatorApprovedHandoffContextUpdateWriteV01(
  input: unknown,
  extraReasons: string[] = [],
): OperatorApprovedHandoffContextUpdateStoreResult {
  const validation =
    validateOperatorApprovedHandoffContextUpdateWriteInputV01(input);
  const refusalValidation: ValidationResult = {
    ...validation,
    ok: false,
    refusal_reasons: uniqueSortedStrings([
      ...validation.refusal_reasons,
      ...extraReasons,
    ]),
  };
  return storeResult(
    "refused",
    null,
    [],
    createReceipt({
      validation: refusalValidation,
      wrote: false,
      refused: true,
      idempotentReplay: false,
      record: null,
    }),
  );
}

export function readHandoffContextUpdateRecordByIdV01(
  recordId: string,
  options: { db: HandoffContextUpdateWriteDbLike },
): OperatorApprovedHandoffContextUpdateStoreResult {
  if (!isSafePublicRef(recordId)) {
    return storeResult(
      "refused",
      null,
      [],
      createRefusedReceipt(["record_id_missing_or_invalid"], null),
    );
  }
  if (!handoffContextUpdateWriteSchemaExistsV01(options.db)) {
    return storeResult(
      "schema_missing",
      null,
      [],
      createRefusedReceipt(["schema_missing"], null),
    );
  }
  const row = options.db
    .prepare(
      `SELECT * FROM handoff_context_update_records
       WHERE record_id = ? AND scope = ?`,
    )
    .get(recordId, OPERATOR_APPROVED_HANDOFF_CONTEXT_UPDATE_SCOPE) as
    | HandoffContextUpdateWriteRow
    | undefined;
  if (!row) {
    return storeResult(
      "not_found",
      null,
      [],
      createRefusedReceipt(["record_not_found"], null),
    );
  }
  const record = rowToRecord(row);
  return storeResult("read", record, [record], rowToReceipt(row));
}

export function readHandoffContextUpdateRecordByIdempotencyKeyV01(
  idempotencyKey: string,
  options: { db: HandoffContextUpdateWriteDbLike },
): OperatorApprovedHandoffContextUpdateStoreResult {
  if (!isSafePublicRef(idempotencyKey)) {
    return storeResult(
      "refused",
      null,
      [],
      createRefusedReceipt(
        ["idempotency_key_missing_or_invalid"],
        idempotencyKey,
      ),
    );
  }
  if (!handoffContextUpdateWriteSchemaExistsV01(options.db)) {
    return storeResult(
      "schema_missing",
      null,
      [],
      createRefusedReceipt(["schema_missing"], idempotencyKey),
    );
  }
  const row = options.db
    .prepare(
      `SELECT * FROM handoff_context_update_records
       WHERE idempotency_key = ? AND scope = ?`,
    )
    .get(
      idempotencyKey,
      OPERATOR_APPROVED_HANDOFF_CONTEXT_UPDATE_SCOPE,
    ) as HandoffContextUpdateWriteRow | undefined;
  if (!row) {
    return storeResult(
      "not_found",
      null,
      [],
      createRefusedReceipt(["record_not_found"], idempotencyKey),
    );
  }
  const record = rowToRecord(row);
  return storeResult("read", record, [record], rowToReceipt(row));
}

export function listHandoffContextUpdateRecordsV01(
  options: HandoffContextUpdateWriteListOptions & {
    db: HandoffContextUpdateWriteDbLike;
  },
): OperatorApprovedHandoffContextUpdateStoreResult {
  if (!handoffContextUpdateWriteSchemaExistsV01(options.db)) {
    return storeResult(
      "schema_missing",
      null,
      [],
      createRefusedReceipt(
        ["schema_missing"],
        options.idempotency_key ?? null,
      ),
    );
  }
  const clauses = ["scope = ?"];
  const params: unknown[] = [OPERATOR_APPROVED_HANDOFF_CONTEXT_UPDATE_SCOPE];
  if (options.idempotency_key) {
    clauses.push("idempotency_key = ?");
    params.push(options.idempotency_key);
  }
  if (options.operator_ref) {
    clauses.push("operator_ref = ?");
    params.push(options.operator_ref);
  }
  const limit = Math.max(1, Math.min(options.limit ?? 50, 100));
  const rows = options.db
    .prepare(
      `SELECT * FROM handoff_context_update_records
       WHERE ${clauses.join(" AND ")}
       ORDER BY created_at DESC, record_id DESC
       LIMIT ?`,
    )
    .all(...params, limit) as HandoffContextUpdateWriteRow[];
  const records = rows.map(rowToRecord);
  return storeResult(
    "listed",
    records[0] ?? null,
    records,
    rows[0]?.receipt_json
      ? rowToReceipt(rows[0])
      : createRefusedReceipt([], options.idempotency_key ?? null),
  );
}

export function createHandoffContextUpdateWriteAuthorityBoundaryV01({
  writeNow,
}: {
  writeNow: boolean;
}): OperatorApprovedHandoffContextUpdateAuthorityBoundary {
  return {
    operator_approved_record_only: true,
    source_of_truth: false,
    durable_local_record: true,
    can_write_db: writeNow,
    can_write_handoff_context_update_record: writeNow,
    can_write_operator_approved_handoff_context_update_record: writeNow,
    can_persist_general_operator_decision: false,
    can_mutate_live_handoff_context: false,
    can_write_selected_refs_to_live_handoff: false,
    can_send_handoff: false,
    can_write_continuity_relay: false,
    can_update_current_working_perspective: false,
    can_write_perspective_unit: false,
    can_write_next_work_bias: false,
    can_write_memory: false,
    can_mutate_memory: false,
    can_promote_memory: false,
    can_apply_project_perspective: false,
    can_create_promotion_decision: false,
    can_create_formation_receipt: false,
    can_write_dogfood_metrics: false,
    can_update_metrics: false,
    can_write_dogfood_ledger: false,
    can_call_provider_openai: false,
    can_call_github: false,
    can_execute_codex: false,
    can_create_pr: false,
    can_merge_pr: false,
    can_run_autonomous_action: false,
    can_create_graph_or_vector_store: false,
    can_create_rag_stack: false,
    can_crawl_or_observe_browser: false,
    notes: [
      "Authority is limited to one operator-approved local handoff context update record.",
      "The live handoff context packet, selected refs, relay, CWP, memory, Perspective, metrics, reuse ledger, provider, GitHub, Codex, PR, autonomous, graph/vector/RAG, crawler, and browser observer surfaces remain out of scope.",
    ],
  };
}

function validateDecisionPreviewShapeV01(
  preview: Record<string, unknown> | null,
  reasons: string[],
): void {
  if (!preview) return;
  if (!asStringArray(preview.source_refs)) {
    reasons.push("decision_preview_source_refs_invalid");
  }
  if (!asStringArray(preview.approval_requirements)) {
    reasons.push("decision_preview_approval_requirements_invalid");
  }
  if (!asStringArray(preview.blocking_reasons)) {
    reasons.push("decision_preview_blocking_reasons_invalid");
  }
  if (!asStringArray(preview.missing_evidence)) {
    reasons.push("decision_preview_missing_evidence_invalid");
  }
  const writeReadiness = getRecord(preview, "write_readiness");
  if (!writeReadiness) {
    reasons.push("decision_preview_write_readiness_invalid");
  } else if (
    !asStringArray(writeReadiness.current_blockers) ||
    !asStringArray(writeReadiness.current_missing_evidence)
  ) {
    reasons.push("decision_preview_write_readiness_invalid");
  }

  const sourceStatus = getRecord(preview, "source_status");
  if (!sourceStatus) {
    reasons.push("decision_preview_source_status_invalid");
  }

  const evidenceSummary = getRecord(preview, "evidence_summary");
  if (!evidenceSummary) {
    reasons.push("decision_preview_evidence_summary_invalid");
  } else if (
    !asStringArray(evidenceSummary.evidence_refs) ||
    !asStringArray(evidenceSummary.missing_evidence)
  ) {
    reasons.push("decision_preview_evidence_summary_invalid");
  }

  const updatePreviewRefs = getRecord(preview, "update_preview_refs");
  if (!updatePreviewRefs) {
    reasons.push("decision_preview_update_preview_refs_invalid");
  } else if (
    !asStringArray(updatePreviewRefs.source_refs) ||
    !asStringArray(updatePreviewRefs.evidence_refs)
  ) {
    reasons.push("decision_preview_update_preview_refs_invalid");
  }

  const wouldWritePreview = getRecord(preview, "would_write_preview");
  if (!wouldWritePreview) {
    reasons.push("would_write_preview_missing_or_invalid");
  } else {
    for (const field of [
      "selected_ref_add_candidates",
      "selected_ref_reinforcement_candidates",
      "warning_update_candidates",
      "context_diet_candidates",
      "keep_unknown_candidates",
      "stop_if_missing_candidates",
      "expected_return_signal_candidates",
    ]) {
      if (!asCandidateArray(wouldWritePreview[field])) {
        reasons.push(`would_write_preview_${field}_invalid`);
      }
    }
    if (
      !asStringArray(wouldWritePreview.source_refs) ||
      !asStringArray(wouldWritePreview.evidence_refs)
    ) {
      reasons.push("would_write_preview_refs_invalid");
    }
  }

  const carryForward = getRecord(preview, "candidate_carry_forward");
  if (!carryForward) {
    reasons.push("candidate_carry_forward_missing_or_invalid");
  } else {
    for (const field of [
      "selected_ref_update_candidates",
      "warning_update_candidates",
      "context_diet_candidates",
      "keep_unknown_candidates",
      "stop_if_missing_candidates",
      "expected_return_signal_candidates",
    ]) {
      if (!asCandidateArray(carryForward[field])) {
        reasons.push(`candidate_carry_forward_${field}_invalid`);
      }
    }
    if (
      !asStringArray(carryForward.unresolved_blockers) ||
      !asStringArray(carryForward.missing_evidence)
    ) {
      reasons.push("candidate_carry_forward_blockers_invalid");
    }
  }

  const authorityBoundary = getRecord(preview, "authority_boundary");
  if (
    !authorityBoundary ||
    authorityBoundary.read_only !== true ||
    authorityBoundary.candidate_material_only !== true ||
    authorityBoundary.source_of_truth !== false ||
    authorityBoundary.derived_read_model !== true
  ) {
    reasons.push("decision_preview_authority_boundary_invalid");
  }
  for (const field of previewForbiddenAuthorityFields) {
    if (authorityBoundary && authorityBoundary[field] !== false) {
      reasons.push(`decision_preview_authority_field_not_false:${field}`);
    }
  }
}

function validateDecisionPreviewReadinessV01(
  preview: Record<string, unknown> | null,
  reasons: string[],
): void {
  if (!preview) return;
  if (preview.decision_preview_status !== "ready_for_future_write") {
    reasons.push("decision_preview_status_not_ready_for_future_write");
  }
  if (preview.recommended_operator_decision !== "approve_for_future_write") {
    reasons.push("recommended_operator_decision_not_approve_for_future_write");
  }
  const writeReadiness = getRecord(preview, "write_readiness");
  if (writeReadiness?.write_ready !== true) {
    reasons.push("write_readiness_not_ready");
  }
  if (arrayLength(writeReadiness?.current_blockers) > 0) {
    reasons.push("write_readiness_current_blockers_present");
  }
  if (arrayLength(writeReadiness?.current_missing_evidence) > 0) {
    reasons.push("write_readiness_current_missing_evidence_present");
  }
  const blockingReasons = asArray(preview.blocking_reasons);
  if (arrayLength(blockingReasons) > 0) {
    reasons.push("blocking_reasons_present");
  }
  const missingEvidence = asArray(preview.missing_evidence);
  if (arrayLength(missingEvidence) > 0) {
    reasons.push("missing_evidence_present");
  }
  const evidenceSummary = getRecord(preview, "evidence_summary");
  if (evidenceSummary?.has_missing_evidence === true) {
    reasons.push("evidence_summary_has_missing_evidence");
  }
  if (evidenceSummary?.has_insufficient_data === true) {
    reasons.push("evidence_summary_has_insufficient_data");
  }
  if (evidenceSummary?.source_authority_boundary_valid !== true) {
    reasons.push("source_authority_boundary_not_valid");
  }
  if (evidenceSummary?.source_write_readiness_false !== true) {
    reasons.push("source_write_readiness_not_false");
  }

  const sourceStatus = getRecord(preview, "source_status");
  if (sourceStatus?.handoff_context_update_preview !== "supplied") {
    reasons.push("source_handoff_context_update_preview_not_supplied");
  }
  if (sourceStatus?.authority_boundary !== "valid_read_only") {
    reasons.push("source_authority_boundary_invalid");
  }
  if (sourceStatus?.source_write_readiness !== "all_false") {
    reasons.push("source_write_readiness_not_all_false");
  }

  const wouldWritePreview = getRecord(preview, "would_write_preview");
  if (
    wouldWritePreview?.proposed_record_kind !==
    "handoff_context_update_write_candidate.v0.1"
  ) {
    reasons.push("proposed_record_kind_invalid");
  }
  const selectedAddCandidates = candidateArray(
    wouldWritePreview?.selected_ref_add_candidates,
  );
  const selectedReinforcementCandidates = candidateArray(
    wouldWritePreview?.selected_ref_reinforcement_candidates,
  );
  const stopIfMissingCandidates = candidateArray(
    wouldWritePreview?.stop_if_missing_candidates,
  );
  const futureWriteCandidateCount = [
    ...selectedAddCandidates,
    ...selectedReinforcementCandidates,
    ...candidateArray(wouldWritePreview?.warning_update_candidates),
    ...candidateArray(wouldWritePreview?.context_diet_candidates),
    ...candidateArray(wouldWritePreview?.expected_return_signal_candidates),
  ].length;
  if (wouldWritePreview && futureWriteCandidateCount === 0) {
    reasons.push("would_write_preview_future_write_material_missing");
  }
  for (const candidate of [
    ...selectedAddCandidates,
    ...selectedReinforcementCandidates,
  ]) {
    if (isUnknownCandidate(candidate)) {
      reasons.push("selected_ref_candidate_unknown_ref");
    }
    if (candidate.evidence_refs.length === 0) {
      reasons.push("selected_ref_candidate_missing_evidence");
    }
  }
  if (stopIfMissingCandidates.length > 0) {
    reasons.push("stop_if_missing_candidates_present");
  }

  const carryForward = getRecord(preview, "candidate_carry_forward");
  if (arrayLength(carryForward?.unresolved_blockers) > 0) {
    reasons.push("carry_forward_unresolved_blockers_present");
  }
  if (arrayLength(carryForward?.missing_evidence) > 0) {
    reasons.push("carry_forward_missing_evidence_present");
  }
}

function buildHandoffContextUpdateRecord(
  validation: ValidationResult & {
    ok: true;
    input: OperatorApprovedHandoffContextUpdateWriteInput;
    decision_preview: HandoffContextUpdateOperatorDecisionPreview;
    idempotency_key: string;
    operator_approval: OperatorApprovedHandoffContextUpdateOperatorApproval;
  },
): OperatorApprovedHandoffContextUpdateRecord {
  const preview = validation.decision_preview;
  const validationHash = createValidationHash({
    decision_preview: preview,
    operator_approval: validation.operator_approval,
    idempotency_key: validation.idempotency_key,
  });
  const recordId = createRecordId(validation.idempotency_key);
  const approvedCandidateMaterial = buildApprovedCandidateMaterial(preview);
  const carryForwardMaterial = buildCarryForwardMaterial(preview);
  const sourceRefs = uniqueSortedStrings([
    OPERATOR_APPROVED_HANDOFF_CONTEXT_UPDATE_RECORD_VERSION,
    OPERATOR_APPROVED_HANDOFF_CONTEXT_UPDATE_STORE_VERSION,
    preview.preview_version,
    ...preview.source_refs,
    ...preview.update_preview_refs.source_refs,
    ...preview.update_preview_refs.evidence_refs,
    ...preview.would_write_preview.source_refs,
    ...preview.would_write_preview.evidence_refs,
    preview.would_write_preview.update_preview_ref ?? "",
    ...candidateRefs(approvedCandidateMaterial),
    ...candidateRefs(carryForwardMaterial),
  ]);

  const recordWithoutFingerprint: Omit<
    OperatorApprovedHandoffContextUpdateRecord,
    "record_fingerprint"
  > = {
    record_version: OPERATOR_APPROVED_HANDOFF_CONTEXT_UPDATE_RECORD_VERSION,
    record_id: recordId,
    idempotency_key: validation.idempotency_key,
    created_at: validation.operator_approval.approved_at,
    scope: OPERATOR_APPROVED_HANDOFF_CONTEXT_UPDATE_SCOPE,
    operator_decision: "approve_for_future_write",
    operator_approval: validation.operator_approval,
    source_refs: sourceRefs,
    decision_preview_refs: {
      preview_version: preview.preview_version,
      decision_preview_status: preview.decision_preview_status,
      recommended_operator_decision: preview.recommended_operator_decision,
      write_ready: preview.write_readiness.write_ready,
      preview_as_of: preview.as_of,
      source_refs: preview.source_refs,
    },
    update_preview_refs: preview.update_preview_refs,
    approved_candidate_material: approvedCandidateMaterial,
    carry_forward_material: carryForwardMaterial,
    evidence_summary: preview.evidence_summary,
    write_validation: {
      validation_version:
        "operator_approved_handoff_context_update_write_validation.v0.1",
      write_ready_revalidated: true,
      required_approval_requirements: [...preview.approval_requirements],
      checklist_confirmations_revalidated: true,
      refused_sample_fixture_default_or_smoke_material: false,
      refused_unrequested_side_effects: false,
      validation_hash: validationHash,
    },
    authority_boundary: createHandoffContextUpdateWriteAuthorityBoundaryV01({
      writeNow: true,
    }),
    notes: uniqueSortedStrings([
      "Written only after operator approval and revalidation of the Handoff Context Update Operator Decision Preview.",
      "Approved candidate material remains a durable local record and is not applied to any live handoff packet.",
      ...(validation.input.notes ?? []),
    ]),
  };

  return {
    ...recordWithoutFingerprint,
    record_fingerprint: createRecordFingerprint(recordWithoutFingerprint),
  };
}

function buildApprovedCandidateMaterial(
  preview: HandoffContextUpdateOperatorDecisionPreview,
): OperatorApprovedHandoffContextUpdateApprovedCandidateMaterial {
  return {
    selected_ref_add_candidates:
      preview.would_write_preview.selected_ref_add_candidates,
    selected_ref_reinforcement_candidates:
      preview.would_write_preview.selected_ref_reinforcement_candidates,
    warning_update_candidates:
      preview.would_write_preview.warning_update_candidates,
    context_diet_candidates: preview.would_write_preview.context_diet_candidates,
    keep_unknown_candidates: preview.would_write_preview.keep_unknown_candidates,
    expected_return_signal_candidates:
      preview.would_write_preview.expected_return_signal_candidates,
  };
}

function buildCarryForwardMaterial(
  preview: HandoffContextUpdateOperatorDecisionPreview,
): OperatorApprovedHandoffContextUpdateCarryForwardMaterial {
  return {
    unresolved_blockers: preview.candidate_carry_forward.unresolved_blockers,
    missing_evidence: preview.candidate_carry_forward.missing_evidence,
    stop_if_missing_candidates:
      preview.candidate_carry_forward.stop_if_missing_candidates,
    rejected_or_excluded_candidates: uniqueCandidates([
      ...preview.candidate_carry_forward.keep_unknown_candidates,
      ...preview.candidate_carry_forward.context_diet_candidates.filter(
        (candidate) =>
          ["noisy", "misleading", "unknown"].includes(
            String(candidate.source_bucket),
          ),
      ),
    ]),
  };
}

function createReceipt({
  validation,
  wrote,
  refused,
  idempotentReplay,
  record,
}: {
  validation: ValidationResult;
  wrote: boolean;
  refused: boolean;
  idempotentReplay: boolean;
  record: OperatorApprovedHandoffContextUpdateRecord | null;
}): OperatorApprovedHandoffContextUpdateWriteReceipt {
  const sourceRefs = uniqueSortedStrings([
    ...sourceRefsFromDecisionPreview(validation.decision_preview),
    ...(record?.source_refs ?? []),
  ]);
  return {
    receipt_version:
      OPERATOR_APPROVED_HANDOFF_CONTEXT_UPDATE_WRITE_RECEIPT_VERSION,
    record_id: record?.record_id ?? null,
    idempotency_key: validation.idempotency_key,
    wrote,
    idempotent_replay: idempotentReplay,
    created_at:
      validation.operator_approval?.approved_at ?? new Date(0).toISOString(),
    refused,
    refusal_reasons: refused ? validation.refusal_reasons : [],
    validation_hash: record?.write_validation.validation_hash ?? null,
    record_fingerprint: record?.record_fingerprint ?? null,
    store_ref: record
      ? `${HANDOFF_CONTEXT_UPDATE_WRITE_TABLE}:${record.record_id}`
      : null,
    source_refs: sourceRefs,
    no_side_effects: createNoSideEffectsV01(),
  };
}

function createRefusedReceipt(
  refusalReasons: string[],
  idempotencyKey: string | null,
): OperatorApprovedHandoffContextUpdateWriteReceipt {
  return {
    receipt_version:
      OPERATOR_APPROVED_HANDOFF_CONTEXT_UPDATE_WRITE_RECEIPT_VERSION,
    record_id: null,
    idempotency_key: idempotencyKey,
    wrote: false,
    idempotent_replay: false,
    created_at: new Date(0).toISOString(),
    refused: refusalReasons.length > 0,
    refusal_reasons: refusalReasons,
    validation_hash: null,
    record_fingerprint: null,
    store_ref: null,
    source_refs: [],
    no_side_effects: createNoSideEffectsV01(),
  };
}

function storeResult(
  status: OperatorApprovedHandoffContextUpdateWriteStatus,
  record: OperatorApprovedHandoffContextUpdateRecord | null,
  records: OperatorApprovedHandoffContextUpdateRecord[],
  receipt: OperatorApprovedHandoffContextUpdateWriteReceipt,
): OperatorApprovedHandoffContextUpdateStoreResult {
  const ok = ["written", "idempotent_existing", "read", "listed"].includes(
    status,
  );
  return {
    store_version: OPERATOR_APPROVED_HANDOFF_CONTEXT_UPDATE_STORE_VERSION,
    scope: OPERATOR_APPROVED_HANDOFF_CONTEXT_UPDATE_SCOPE,
    status,
    ok,
    record,
    records,
    receipt,
    error_code: ok ? null : status,
    no_side_effects: createNoSideEffectsV01(),
  };
}

function validationResult({
  refusal_reasons,
  input,
  decision_preview,
  idempotency_key,
  operator_approval,
}: Omit<ValidationResult, "ok">): ValidationResult {
  return {
    ok: refusal_reasons.length === 0,
    refusal_reasons,
    input,
    decision_preview,
    idempotency_key,
    operator_approval,
  };
}

function rowToRecord(
  row: HandoffContextUpdateWriteRow,
): OperatorApprovedHandoffContextUpdateRecord {
  return JSON.parse(row.record_json) as OperatorApprovedHandoffContextUpdateRecord;
}

function rowToReceipt(
  row: HandoffContextUpdateWriteRow,
): OperatorApprovedHandoffContextUpdateWriteReceipt {
  return JSON.parse(row.receipt_json) as OperatorApprovedHandoffContextUpdateWriteReceipt;
}

function createRecordId(idempotencyKey: string): string {
  return `handoff-context-update-record:${sha256(idempotencyKey).slice(0, 24)}`;
}

function createValidationHash(value: unknown): string {
  return `sha256:${sha256(stableStringify(value))}`;
}

function createRecordFingerprint(
  record: Omit<OperatorApprovedHandoffContextUpdateRecord, "record_fingerprint">,
): string {
  return `sha256:${sha256(stableStringify(record))}`;
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function createNoSideEffectsV01(): OperatorApprovedHandoffContextUpdateNoSideEffects {
  return {
    handoff_context_mutated: false,
    selected_refs_written_to_live_handoff: false,
    handoff_sent: false,
    continuity_relay_written: false,
    current_working_perspective_updated: false,
    perspective_unit_written: false,
    next_work_bias_written: false,
    memory_mutated: false,
    dogfood_metrics_written: false,
    reuse_ledger_written: false,
    provider_called: false,
    github_called: false,
    codex_executed: false,
    pr_created: false,
    pr_merged: false,
    autonomous_action_run: false,
    graph_or_vector_store_created: false,
    rag_stack_created: false,
    crawler_or_browser_observer_created: false,
  };
}

function collectUnsafePublicRefs(
  preview: Record<string, unknown> | null,
): { path: string; value: string }[] {
  const unsafe: { path: string; value: string }[] = [];
  if (!preview) return unsafe;
  for (const [path, value] of collectPublicRefEntries(preview)) {
    if (!isSafePublicRef(value)) unsafe.push({ path, value });
  }
  return unsafe;
}

function collectPublicRefEntries(value: unknown, path = ""): [string, string][] {
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) =>
      collectPublicRefEntries(entry, `${path}[${index}]`),
    );
  }
  if (!isRecord(value)) return [];
  const entries: [string, string][] = [];
  for (const [key, entryValue] of Object.entries(value)) {
    const entryPath = path ? `${path}.${key}` : key;
    if (isPublicRefKey(key)) {
      if (typeof entryValue === "string") {
        entries.push([entryPath, entryValue]);
      } else if (Array.isArray(entryValue)) {
        for (const [index, item] of entryValue.entries()) {
          if (typeof item === "string") {
            entries.push([`${entryPath}[${index}]`, item]);
          }
        }
      }
    }
    entries.push(...collectPublicRefEntries(entryValue, entryPath));
  }
  return entries;
}

function isPublicRefKey(key: string): boolean {
  return (
    key === "record_id" ||
    key === "idempotency_key" ||
    key.endsWith("_ref") ||
    key.endsWith("_refs") ||
    key === "ref_id" ||
    key === "candidate_id" ||
    key === "source_candidate_id"
  );
}

function containsSampleDefaultOrSmokeMaterial(value: unknown): boolean {
  const normalized = stableStringify(value).toLowerCase();
  return sampleDefaultOrSmokeMarkers.some((marker) =>
    normalized.includes(marker),
  );
}

function isDefaultWorkbenchMissingOrInsufficientMaterial(
  preview: Record<string, unknown> | null,
): boolean {
  if (!preview) return false;
  const normalized = stableStringify(preview).toLowerCase();
  const evidenceSummary = getRecord(preview, "evidence_summary");
  const sourceStatus = getRecord(preview, "source_status");
  return (
    normalized.includes("workbench:default") ||
    normalized.includes("default_handoff_context_update") ||
    sourceStatus?.handoff_context_update_preview === "missing" ||
    evidenceSummary?.has_insufficient_data === true ||
    evidenceSummary?.has_missing_evidence === true
  );
}

function findRequestedSideEffectRefusals(value: unknown): string[] {
  if (value === undefined) return [];
  if (!isRecord(value)) return ["requested_side_effects_invalid"];
  const reasons: string[] = [];
  for (const [key, entryValue] of Object.entries(value)) {
    if (!isTruthyActionRequest(entryValue)) continue;
    if (!allowedRequestedSideEffectKeys.has(key)) {
      reasons.push(`requested_side_effect_out_of_scope:${key}`);
    }
  }
  return reasons;
}

function findForbiddenActionRequests(value: unknown, path = ""): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      findForbiddenActionRequests(item, `${path}[${index}]`),
    );
  }
  if (!isRecord(value)) return [];
  const reasons: string[] = [];
  for (const [key, entryValue] of Object.entries(value)) {
    const entryPath = path ? `${path}.${key}` : key;
    if (key === "checklist_confirmations") {
      continue;
    }
    if (
      isForbiddenActionRequestKey(key) &&
      isTruthyActionRequest(entryValue)
    ) {
      reasons.push(`forbidden_action_requested:${entryPath}`);
      continue;
    }
    reasons.push(...findForbiddenActionRequests(entryValue, entryPath));
  }
  return uniqueSortedStrings(reasons);
}

function isTruthyActionRequest(value: unknown): boolean {
  if (value === true) return true;
  if (typeof value === "number") return value > 0;
  if (typeof value !== "string") return false;
  return /^(true|yes|requested|enabled|allow|allowed|write|update|mutate|apply|create|call|execute|send|run|merge|retry|replay|deploy)$/i.test(
    value.trim(),
  );
}

function isForbiddenActionRequestKey(key: string): boolean {
  const normalized = key.toLowerCase();
  if (
    normalized.startsWith("no_") ||
    normalized.startsWith("not_") ||
    normalized.includes("would_not") ||
    normalized.includes("_not_") ||
    normalized.includes("refused") ||
    normalized.includes("blocked") ||
    allowedRequestedSideEffectKeys.has(key)
  ) {
    return false;
  }
  return forbiddenSideEffectKeyPatterns.some((pattern) => pattern.test(key));
}

function isSafePublicRef(value: string): boolean {
  if (value.length < 2 || value.length > 220) return false;
  if (/[\s\0-\x1f\x7f]/.test(value)) return false;
  if (value.includes("..") || value.includes("//")) return false;
  if (/^[A-Za-z]:[\\/]/.test(value)) return false;
  if (/^[a-z][a-z0-9+.-]*:\/\/[^/\s]+@/i.test(value)) return false;
  if (/[:/\\]@|@[:/\\]/.test(value)) return false;
  if (!/^[A-Za-z0-9/_:./#-]+$/.test(value)) return false;
  const normalized = value.toLowerCase();
  if (/^\/(users|home|private|volumes|tmp|var|etc|opt)\b/.test(normalized)) {
    return false;
  }
  return !privateRefMarkers.some((marker) => normalized.includes(marker));
}

function asNonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function asSafePublicRef(value: unknown): string | null {
  const ref = asNonEmptyString(value);
  return ref && isSafePublicRef(ref) ? ref : null;
}

function asCleanStatement(value: unknown): string | null {
  const statement = asNonEmptyString(value);
  if (!statement || statement.length > 500) return null;
  if (/[\0-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(statement)) return null;
  const normalized = statement.toLowerCase();
  if (privateRefMarkers.some((marker) => normalized.includes(marker))) {
    return null;
  }
  return statement;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getRecord(
  value: unknown,
  field: string,
): Record<string, unknown> | null {
  if (!isRecord(value)) return null;
  const nested = value[field];
  return isRecord(nested) ? nested : null;
}

function asArray(value: unknown): unknown[] | null {
  return Array.isArray(value) ? value : null;
}

function asStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  return value.every((entry) => typeof entry === "string")
    ? (value as string[])
    : null;
}

function stringsFromArray(value: unknown): string[] {
  return asStringArray(value) ?? [];
}

function arrayLength(value: unknown): number {
  return asArray(value)?.length ?? 0;
}

function asCandidateArray(value: unknown): HandoffContextUpdateCandidate[] | null {
  if (!Array.isArray(value)) return null;
  return value.every(isCandidate)
    ? (value as HandoffContextUpdateCandidate[])
    : null;
}

function candidateArray(value: unknown): HandoffContextUpdateCandidate[] {
  return asCandidateArray(value) ?? [];
}

function isCandidate(value: unknown): value is HandoffContextUpdateCandidate {
  return (
    isRecord(value) &&
    typeof value.candidate_id === "string" &&
    typeof value.ref_id === "string" &&
    typeof value.label === "string" &&
    typeof value.summary === "string" &&
    typeof value.candidate_kind === "string" &&
    typeof value.source_bucket === "string" &&
    typeof value.source_adjustment_kind === "string" &&
    typeof value.source_candidate_id === "string" &&
    asStringArray(value.source_refs) !== null &&
    asStringArray(value.evidence_refs) !== null &&
    asStringArray(value.source_record_refs) !== null &&
    asStringArray(value.existing_handoff_ref_ids) !== null &&
    value.candidate_only === true &&
    typeof value.review_note === "string"
  );
}

function isUnknownCandidate(candidate: HandoffContextUpdateCandidate): boolean {
  return (
    candidate.source_bucket === "unknown" ||
    candidate.candidate_kind === "unknown_context" ||
    /\bunknown\b|unknown[-_:]/i.test(candidate.ref_id) ||
    /\bunknown\b|unknown[-_:]/i.test(candidate.label)
  );
}

function uniqueCandidates(
  candidates: readonly HandoffContextUpdateCandidate[],
): HandoffContextUpdateCandidate[] {
  const seen = new Set<string>();
  const unique: HandoffContextUpdateCandidate[] = [];
  for (const candidate of candidates) {
    const key = `${candidate.candidate_id}:${candidate.ref_id}:${candidate.candidate_kind}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(candidate);
  }
  return unique;
}

function candidateRefs(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap(candidateRefs);
  }
  if (!isRecord(value)) return [];
  const refs: string[] = [];
  if (isCandidate(value)) {
    refs.push(
      value.candidate_id,
      value.ref_id,
      value.source_candidate_id,
      ...value.source_refs,
      ...value.evidence_refs,
      ...value.source_record_refs,
      ...value.existing_handoff_ref_ids,
    );
  }
  for (const entry of Object.values(value)) {
    refs.push(...candidateRefs(entry));
  }
  return uniqueSortedStrings(refs);
}

function sourceRefsFromDecisionPreview(
  value: HandoffContextUpdateOperatorDecisionPreview | null,
): string[] {
  if (!value) return [];
  const updatePreviewRefs = getRecord(value, "update_preview_refs");
  const wouldWritePreview = getRecord(value, "would_write_preview");
  return uniqueSortedStrings([
    ...stringsFromArray(value.source_refs),
    ...stringsFromArray(updatePreviewRefs?.source_refs),
    ...stringsFromArray(updatePreviewRefs?.evidence_refs),
    ...stringsFromArray(wouldWritePreview?.source_refs),
    ...stringsFromArray(wouldWritePreview?.evidence_refs),
  ]);
}

function uniqueSortedStrings(values: readonly string[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter((value) => value.length > 0),
    ),
  ).sort();
}

function stableStringify(value: unknown): string {
  return JSON.stringify(sortJson(value));
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJson);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, sortJson(value[key])]),
  );
}
