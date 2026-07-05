import { createHash } from "node:crypto";

import {
  SELECTED_SESSION_DIGEST_INGEST_OPERATOR_DECISION_PREVIEW_VERSION,
  type SelectedSessionDigestIngestOperatorDecisionPreview,
} from "@/types/selected-session-digest-ingest-operator-decision";
import {
  OPERATOR_APPROVED_SELECTED_SESSION_DIGEST_INGEST_DECISION_RECORD_VERSION,
  OPERATOR_APPROVED_SELECTED_SESSION_DIGEST_INGEST_DECISION_SCOPE,
  OPERATOR_APPROVED_SELECTED_SESSION_DIGEST_INGEST_DECISION_STORE_VERSION,
  OPERATOR_APPROVED_SELECTED_SESSION_DIGEST_INGEST_DECISION_WRITE_RECEIPT_VERSION,
  type OperatorApprovedSelectedSessionDigestIngestDecisionApprovedFutureMaterial,
  type OperatorApprovedSelectedSessionDigestIngestDecisionAuthorityBoundary,
  type OperatorApprovedSelectedSessionDigestIngestDecisionCarryForwardMaterial,
  type OperatorApprovedSelectedSessionDigestIngestDecisionNoSideEffects,
  type OperatorApprovedSelectedSessionDigestIngestDecisionOperatorApproval,
  type OperatorApprovedSelectedSessionDigestIngestDecisionRecord,
  type OperatorApprovedSelectedSessionDigestIngestDecisionStoreResult,
  type OperatorApprovedSelectedSessionDigestIngestDecisionWriteInput,
  type OperatorApprovedSelectedSessionDigestIngestDecisionWriteReceipt,
  type OperatorApprovedSelectedSessionDigestIngestDecisionWriteStatus,
} from "@/types/selected-session-digest-ingest-decision-write";

export const SELECTED_SESSION_DIGEST_INGEST_DECISION_WRITE_TABLE =
  "selected_session_digest_ingest_decision_records" as const;

export interface SelectedSessionDigestIngestDecisionWriteDbLike {
  exec(sql: string): unknown;
  prepare(sql: string): {
    run(...params: unknown[]): unknown;
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  };
}

export interface SelectedSessionDigestIngestDecisionWriteListOptions {
  idempotency_key?: string;
  operator_ref?: string;
  limit?: number;
}

interface SelectedSessionDigestIngestDecisionWriteRow {
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
  input: OperatorApprovedSelectedSessionDigestIngestDecisionWriteInput | null;
  decision_preview: SelectedSessionDigestIngestOperatorDecisionPreview | null;
  idempotency_key: string | null;
  operator_approval: OperatorApprovedSelectedSessionDigestIngestDecisionOperatorApproval | null;
}

const previewForbiddenAuthorityFields = [
  "can_persist_decision",
  "can_write_db",
  "can_create_schema",
  "can_create_ingest_decision_record",
  "can_create_ingest_decision_receipt",
  "can_create_ingest_record",
  "can_create_ingest_receipt",
  "can_write_selected_session_digest",
  "can_write_memory",
  "can_mutate_memory",
  "can_promote_memory",
  "can_mutate_current_working_perspective",
  "can_write_perspective_unit",
  "can_write_next_work_bias",
  "can_update_continuity_relay",
  "can_mutate_handoff_context",
  "can_apply_handoff_context",
  "can_write_selected_refs_to_live_handoff",
  "can_send_handoff",
  "can_write_dogfood_metrics",
  "can_write_reuse_ledger",
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

const allowedRequestedSideEffectKeys = new Set([
  "can_write_db",
  "can_create_ingest_decision_record",
  "can_create_operator_approved_ingest_decision_record",
  "can_create_ingest_decision_receipt",
]);

const forbiddenSideEffectKeyPatterns = [
  /selected.*session.*digest.*ingest.*record/i,
  /selected.*session.*digest.*ingest.*receipt/i,
  /actual.*ingest/i,
  /write.*selected.*session.*digest/i,
  /persist.*selected.*session.*digest/i,
  /memory/i,
  /current.*working.*perspective/i,
  /\bcwp\b/i,
  /perspective.*unit/i,
  /next.*work.*bias/i,
  /continuity.*relay/i,
  /handoff.*context/i,
  /selected.*refs.*live/i,
  /send.*handoff/i,
  /dogfood.*metrics/i,
  /reuse.*ledger/i,
  /provider/i,
  /openai/i,
  /github/i,
  /codex/i,
  /\bpr\b.*create/i,
  /create.*pull.*request/i,
  /\bpr\b.*merge/i,
  /merge.*pull.*request/i,
  /autonomous/i,
  /graph/i,
  /vector/i,
  /\brag\b/i,
  /crawler/i,
  /browser.*observer/i,
] as const;

const sampleDefaultOrSmokeMarkers = [
  "sample",
  "fixture",
  "smoke",
  "workbench:default",
  "default_workbench",
  "default-workbench",
] as const;

export const selectedSessionDigestIngestDecisionWriteSchemaSqlV01 = `
CREATE TABLE IF NOT EXISTS selected_session_digest_ingest_decision_records (
  record_id TEXT PRIMARY KEY,
  idempotency_key TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL,
  scope TEXT NOT NULL,
  operator_ref TEXT NOT NULL,
  record_fingerprint TEXT NOT NULL,
  record_json TEXT NOT NULL,
  receipt_json TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_selected_session_digest_ingest_decision_records_scope_created
  ON selected_session_digest_ingest_decision_records(scope, created_at, record_id);

CREATE INDEX IF NOT EXISTS idx_selected_session_digest_ingest_decision_records_operator
  ON selected_session_digest_ingest_decision_records(scope, operator_ref, created_at, record_id);
`;

export function ensureSelectedSessionDigestIngestDecisionWriteSchemaV01(
  db: SelectedSessionDigestIngestDecisionWriteDbLike,
): void {
  db.exec(selectedSessionDigestIngestDecisionWriteSchemaSqlV01);
}

export function selectedSessionDigestIngestDecisionWriteSchemaExistsV01(
  db: SelectedSessionDigestIngestDecisionWriteDbLike,
): boolean {
  const row = db
    .prepare(
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name = ?`,
    )
    .get(SELECTED_SESSION_DIGEST_INGEST_DECISION_WRITE_TABLE) as
    | { name?: string }
    | undefined;
  return row?.name === SELECTED_SESSION_DIGEST_INGEST_DECISION_WRITE_TABLE;
}

export function validateOperatorApprovedSelectedSessionDigestIngestDecisionWriteInputV01(
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

  const idempotencyKey = asSafePublicRef(input.idempotency_key);
  if (!idempotencyKey) reasons.push("idempotency_key_missing_or_invalid");

  const decisionPreviewRecord = getRecord(input, "decision_preview");
  const decisionPreview = decisionPreviewRecord
    ? (decisionPreviewRecord as unknown as SelectedSessionDigestIngestOperatorDecisionPreview)
    : null;
  if (!decisionPreviewRecord) {
    reasons.push("decision_preview_missing");
  } else if (
    decisionPreviewRecord.preview_version !==
    SELECTED_SESSION_DIGEST_INGEST_OPERATOR_DECISION_PREVIEW_VERSION
  ) {
    reasons.push("decision_preview_version_invalid");
  }

  validateDecisionPreviewShapeV01(decisionPreviewRecord, reasons);
  validateDecisionPreviewReadinessV01(decisionPreviewRecord, reasons);

  const operatorApprovalRecord = getRecord(input, "operator_approval");
  if (!operatorApprovalRecord) {
    reasons.push("operator_approval_missing");
  }
  if (
    operatorApprovalRecord?.operator_decision !==
    "approve_for_future_ingest_write"
  ) {
    reasons.push(
      "operator_approval_decision_not_approve_for_future_ingest_write",
    );
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

  const previewOperatorRef = getRecord(
    decisionPreviewRecord,
    "would_write_decision_record_preview",
  )?.operator_ref;
  if (
    operatorRef &&
    typeof previewOperatorRef === "string" &&
    previewOperatorRef &&
    operatorRef !== previewOperatorRef
  ) {
    reasons.push("operator_ref_mismatch_with_decision_preview");
  }

  const requestedPreviewIdempotencyKey = getRecord(
    decisionPreviewRecord,
    "would_write_decision_record_preview",
  )?.requested_idempotency_key;
  if (
    idempotencyKey &&
    typeof requestedPreviewIdempotencyKey === "string" &&
    requestedPreviewIdempotencyKey &&
    idempotencyKey !== requestedPreviewIdempotencyKey
  ) {
    reasons.push("idempotency_key_mismatch_with_decision_preview");
  }

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

  const unsafeRefs = collectUnsafePublicRefs({
    decision_preview: decisionPreviewRecord,
    operator_approval: operatorApprovalRecord,
    idempotency_key: input.idempotency_key,
  });
  for (const ref of unsafeRefs) {
    reasons.push(`public_ref_unsafe:${ref.path}`);
  }

  if (containsRawOrPrivateMarkers(input)) {
    reasons.push("raw_or_private_marker_material_refused");
  }
  if (containsSampleDefaultOrSmokeMaterial(input)) {
    reasons.push("sample_fixture_default_or_smoke_material_refused");
  }
  if (isDefaultWorkbenchMissingOrInsufficientMaterial(decisionPreviewRecord)) {
    reasons.push("default_workbench_missing_or_insufficient_material_refused");
  }
  reasons.push(...findRequestedSideEffectRefusals(input.requested_side_effects));
  reasons.push(
    ...findForbiddenActionRequests({
      requested_side_effects: input.requested_side_effects,
      notes: input.notes,
      approval_statement: operatorApprovalRecord?.approval_statement,
    }),
  );

  return validationResult({
    refusal_reasons: uniqueSortedStrings(reasons),
    input:
      reasons.length === 0
        ? (input as unknown as OperatorApprovedSelectedSessionDigestIngestDecisionWriteInput)
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
              checklistConfirmations as OperatorApprovedSelectedSessionDigestIngestDecisionOperatorApproval["checklist_confirmations"],
          }
        : null,
  });
}

export function writeOperatorApprovedSelectedSessionDigestIngestDecisionV01(
  input: unknown,
  options: { db: SelectedSessionDigestIngestDecisionWriteDbLike },
): OperatorApprovedSelectedSessionDigestIngestDecisionStoreResult {
  const validation =
    validateOperatorApprovedSelectedSessionDigestIngestDecisionWriteInputV01(
      input,
    );
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

  ensureSelectedSessionDigestIngestDecisionWriteSchemaV01(options.db);
  const record = buildSelectedSessionDigestIngestDecisionRecord(
    validation as ValidationResult & {
      ok: true;
      input: OperatorApprovedSelectedSessionDigestIngestDecisionWriteInput;
      decision_preview: SelectedSessionDigestIngestOperatorDecisionPreview;
      idempotency_key: string;
      operator_approval: OperatorApprovedSelectedSessionDigestIngestDecisionOperatorApproval;
    },
  );
  const existing =
    readSelectedSessionDigestIngestDecisionRecordByIdempotencyKeyV01(
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
        `INSERT INTO selected_session_digest_ingest_decision_records (
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

export function refuseOperatorApprovedSelectedSessionDigestIngestDecisionWriteV01(
  input: unknown,
  extraReasons: string[] = [],
): OperatorApprovedSelectedSessionDigestIngestDecisionStoreResult {
  const validation =
    validateOperatorApprovedSelectedSessionDigestIngestDecisionWriteInputV01(
      input,
    );
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

export function readSelectedSessionDigestIngestDecisionRecordByIdV01(
  recordId: string,
  options: { db: SelectedSessionDigestIngestDecisionWriteDbLike },
): OperatorApprovedSelectedSessionDigestIngestDecisionStoreResult {
  if (!isSafePublicRef(recordId)) {
    return storeResult(
      "refused",
      null,
      [],
      createRefusedReceipt(["record_id_missing_or_invalid"], null),
    );
  }
  if (!selectedSessionDigestIngestDecisionWriteSchemaExistsV01(options.db)) {
    return storeResult(
      "schema_missing",
      null,
      [],
      createRefusedReceipt(["schema_missing"], null),
    );
  }
  const row = options.db
    .prepare(
      `SELECT * FROM selected_session_digest_ingest_decision_records
       WHERE record_id = ? AND scope = ?`,
    )
    .get(recordId, OPERATOR_APPROVED_SELECTED_SESSION_DIGEST_INGEST_DECISION_SCOPE) as
    | SelectedSessionDigestIngestDecisionWriteRow
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

export function readSelectedSessionDigestIngestDecisionRecordByIdempotencyKeyV01(
  idempotencyKey: string,
  options: { db: SelectedSessionDigestIngestDecisionWriteDbLike },
): OperatorApprovedSelectedSessionDigestIngestDecisionStoreResult {
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
  if (!selectedSessionDigestIngestDecisionWriteSchemaExistsV01(options.db)) {
    return storeResult(
      "schema_missing",
      null,
      [],
      createRefusedReceipt(["schema_missing"], idempotencyKey),
    );
  }
  const row = options.db
    .prepare(
      `SELECT * FROM selected_session_digest_ingest_decision_records
       WHERE idempotency_key = ? AND scope = ?`,
    )
    .get(
      idempotencyKey,
      OPERATOR_APPROVED_SELECTED_SESSION_DIGEST_INGEST_DECISION_SCOPE,
    ) as SelectedSessionDigestIngestDecisionWriteRow | undefined;
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

export function listSelectedSessionDigestIngestDecisionRecordsV01(
  options: SelectedSessionDigestIngestDecisionWriteListOptions & {
    db: SelectedSessionDigestIngestDecisionWriteDbLike;
  },
): OperatorApprovedSelectedSessionDigestIngestDecisionStoreResult {
  if (!selectedSessionDigestIngestDecisionWriteSchemaExistsV01(options.db)) {
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
  const params: unknown[] = [
    OPERATOR_APPROVED_SELECTED_SESSION_DIGEST_INGEST_DECISION_SCOPE,
  ];
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
      `SELECT * FROM selected_session_digest_ingest_decision_records
       WHERE ${clauses.join(" AND ")}
       ORDER BY created_at DESC, record_id DESC
       LIMIT ?`,
    )
    .all(...params, limit) as SelectedSessionDigestIngestDecisionWriteRow[];
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

export function createSelectedSessionDigestIngestDecisionWriteAuthorityBoundaryV01({
  writeNow,
}: {
  writeNow: boolean;
}): OperatorApprovedSelectedSessionDigestIngestDecisionAuthorityBoundary {
  return {
    operator_approved_record_only: true,
    durable_local_record: true,
    source_of_truth: false,
    can_write_db: writeNow,
    can_create_ingest_decision_record: writeNow,
    can_create_operator_approved_ingest_decision_record: writeNow,
    can_create_ingest_decision_receipt: writeNow,
    can_create_ingest_record: false,
    can_create_ingest_receipt: false,
    can_write_selected_session_digest: false,
    can_write_memory: false,
    can_mutate_memory: false,
    can_promote_memory: false,
    can_mutate_current_working_perspective: false,
    can_write_perspective_unit: false,
    can_write_next_work_bias: false,
    can_update_continuity_relay: false,
    can_mutate_handoff_context: false,
    can_apply_handoff_context: false,
    can_write_selected_refs_to_live_handoff: false,
    can_send_handoff: false,
    can_write_dogfood_metrics: false,
    can_write_reuse_ledger: false,
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
      "Authority is limited to one operator-approved selected session digest ingest decision record.",
      "This writer cannot create selected session digest ingest records or receipts, persist selected digest material, mutate memory/CWP/Perspective/handoff state, call providers/GitHub/Codex, or run autonomous actions.",
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
  if (!asStringArray(preview.refusal_reasons)) {
    reasons.push("decision_preview_refusal_reasons_invalid");
  }
  const writeReadiness = getRecord(preview, "write_readiness");
  if (!writeReadiness) {
    reasons.push("decision_preview_write_readiness_invalid");
  } else if (
    !asStringArray(writeReadiness.current_blockers) ||
    !asStringArray(writeReadiness.current_missing_evidence) ||
    !asStringArray(writeReadiness.current_refusal_reasons) ||
    !asStringArray(writeReadiness.current_insufficient_data)
  ) {
    reasons.push("decision_preview_write_readiness_invalid");
  }
  if (!getRecord(preview, "source_status")) {
    reasons.push("decision_preview_source_status_invalid");
  }
  const evidenceSummary = getRecord(preview, "evidence_summary");
  if (!evidenceSummary) {
    reasons.push("decision_preview_evidence_summary_invalid");
  } else if (
    !asStringArray(evidenceSummary.evidence_refs) ||
    !asStringArray(evidenceSummary.missing_evidence) ||
    !asStringArray(evidenceSummary.unsafe_refs)
  ) {
    reasons.push("decision_preview_evidence_summary_invalid");
  }
  const contractPreviewRefs = getRecord(preview, "ingest_contract_preview_refs");
  if (!contractPreviewRefs) {
    reasons.push("decision_preview_ingest_contract_preview_refs_invalid");
  } else if (
    !asStringArray(contractPreviewRefs.source_refs) ||
    !asStringArray(contractPreviewRefs.evidence_refs)
  ) {
    reasons.push("decision_preview_ingest_contract_preview_refs_invalid");
  }

  const wouldWritePreview = getRecord(
    preview,
    "would_write_decision_record_preview",
  );
  if (!wouldWritePreview) {
    reasons.push("would_write_decision_record_preview_missing_or_invalid");
  } else if (
    !asStringArray(wouldWritePreview.selected_digest_candidate_refs) ||
    !asStringArray(wouldWritePreview.selectable_digest_candidate_refs) ||
    !asStringArray(wouldWritePreview.source_refs) ||
    !asStringArray(wouldWritePreview.evidence_refs) ||
    !Array.isArray(wouldWritePreview.sanitized_candidate_summaries)
  ) {
    reasons.push("would_write_decision_record_preview_refs_invalid");
  }

  const carryForward = getRecord(preview, "candidate_carry_forward");
  if (!carryForward) {
    reasons.push("candidate_carry_forward_missing_or_invalid");
  } else if (
    !asStringArray(carryForward.review_only_candidate_refs) ||
    !asStringArray(carryForward.unresolved_contract_blockers) ||
    !asStringArray(carryForward.contract_missing_evidence)
  ) {
    reasons.push("candidate_carry_forward_arrays_invalid");
  }

  const authorityBoundary = getRecord(preview, "authority_boundary");
  if (
    !authorityBoundary ||
    authorityBoundary.read_only !== true ||
    authorityBoundary.advisory_only !== true ||
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
  if (
    preview.decision_preview_status !==
    "ready_for_future_decision_record_write"
  ) {
    reasons.push("decision_preview_status_not_ready_for_future_decision_record_write");
  }
  if (
    preview.recommended_operator_decision !==
    "approve_for_future_ingest_write"
  ) {
    reasons.push("recommended_operator_decision_not_approve_for_future_ingest_write");
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
  if (arrayLength(writeReadiness?.current_refusal_reasons) > 0) {
    reasons.push("write_readiness_current_refusal_reasons_present");
  }
  if (arrayLength(writeReadiness?.current_insufficient_data) > 0) {
    reasons.push("write_readiness_current_insufficient_data_present");
  }
  if (arrayLength(preview.blocking_reasons) > 0) {
    reasons.push("blocking_reasons_present");
  }
  if (arrayLength(preview.missing_evidence) > 0) {
    reasons.push("missing_evidence_present");
  }
  if (arrayLength(preview.refusal_reasons) > 0) {
    reasons.push("refusal_reasons_present");
  }
  const evidenceSummary = getRecord(preview, "evidence_summary");
  if (evidenceSummary?.has_missing_evidence === true) {
    reasons.push("evidence_summary_has_missing_evidence");
  }
  if (evidenceSummary?.has_insufficient_data === true) {
    reasons.push("evidence_summary_has_insufficient_data");
  }
  if (evidenceSummary?.has_refusal_reasons === true) {
    reasons.push("evidence_summary_has_refusal_reasons");
  }
  if (evidenceSummary?.source_authority_boundary_valid !== true) {
    reasons.push("source_authority_boundary_not_valid");
  }
  if (evidenceSummary?.source_write_authority_false !== true) {
    reasons.push("source_write_authority_not_false");
  }

  const wouldWritePreview = getRecord(
    preview,
    "would_write_decision_record_preview",
  );
  if (
    wouldWritePreview?.proposed_record_kind !==
    "operator_approved_selected_session_digest_ingest_decision_record.v0.1"
  ) {
    reasons.push("proposed_record_kind_invalid");
  }
  if (
    wouldWritePreview?.proposed_receipt_kind !==
    "operator_approved_selected_session_digest_ingest_decision_write_receipt.v0.1"
  ) {
    reasons.push("proposed_receipt_kind_invalid");
  }
  if (
    wouldWritePreview?.proposed_future_ingest_record_kind !==
    "selected_session_digest_ingest_record.v0.1"
  ) {
    reasons.push("proposed_future_ingest_record_kind_invalid");
  }
  if (
    wouldWritePreview?.proposed_future_ingest_receipt_kind !==
    "selected_session_digest_ingest_receipt.v0.1"
  ) {
    reasons.push("proposed_future_ingest_receipt_kind_invalid");
  }
  const selectedRefs = stringsFromArray(
    wouldWritePreview?.selected_digest_candidate_refs,
  );
  const selectableRefs = new Set(
    stringsFromArray(wouldWritePreview?.selectable_digest_candidate_refs),
  );
  if (selectedRefs.length === 0) {
    reasons.push("selected_digest_candidate_refs_missing");
  }
  for (const ref of selectedRefs) {
    if (!selectableRefs.has(ref)) {
      reasons.push("selected_digest_candidate_refs_not_subset_of_selectable_refs");
      reasons.push("unknown_selected_digest_candidate_ref");
    }
  }
  if (!asSafePublicRef(wouldWritePreview?.privacy_review_confirmation_ref)) {
    reasons.push("privacy_review_confirmation_ref_missing");
  }
  if (!asSafePublicRef(wouldWritePreview?.requested_idempotency_key)) {
    reasons.push("requested_idempotency_key_missing");
  }
  if (!asSafePublicRef(wouldWritePreview?.source_ref)) {
    reasons.push("source_ref_missing");
  }
  if (!asSafePublicRef(wouldWritePreview?.operator_ref)) {
    reasons.push("operator_ref_missing");
  }
  if (
    !asSafePublicRef(wouldWritePreview?.session_ref) &&
    !asSafePublicRef(wouldWritePreview?.project_ref)
  ) {
    reasons.push("session_or_project_ref_missing");
  }
  if (stringsFromArray(wouldWritePreview?.evidence_refs).length === 0) {
    reasons.push("evidence_refs_missing");
  }
}

function buildSelectedSessionDigestIngestDecisionRecord(
  validation: ValidationResult & {
    ok: true;
    input: OperatorApprovedSelectedSessionDigestIngestDecisionWriteInput;
    decision_preview: SelectedSessionDigestIngestOperatorDecisionPreview;
    idempotency_key: string;
    operator_approval: OperatorApprovedSelectedSessionDigestIngestDecisionOperatorApproval;
  },
): OperatorApprovedSelectedSessionDigestIngestDecisionRecord {
  const preview = validation.decision_preview;
  const validationHash = createValidationHash({
    decision_preview: preview,
    operator_approval: validation.operator_approval,
    idempotency_key: validation.idempotency_key,
  });
  const recordId = createRecordId(validation.idempotency_key);
  const approvedFutureIngestMaterial = buildApprovedFutureIngestMaterial(preview);
  const carryForwardMaterial = buildCarryForwardMaterial(preview);
  const sourceRefs = uniqueSortedStrings([
    OPERATOR_APPROVED_SELECTED_SESSION_DIGEST_INGEST_DECISION_RECORD_VERSION,
    OPERATOR_APPROVED_SELECTED_SESSION_DIGEST_INGEST_DECISION_STORE_VERSION,
    preview.preview_version,
    ...preview.source_refs,
    ...preview.ingest_contract_preview_refs.source_refs,
    ...preview.ingest_contract_preview_refs.evidence_refs,
    preview.ingest_contract_preview_refs.contract_preview_ref ?? "",
    preview.ingest_contract_preview_refs.intake_preview_ref ?? "",
    ...approvedFutureIngestMaterial.selected_digest_candidate_refs,
    ...approvedFutureIngestMaterial.evidence_refs,
    ...approvedFutureIngestMaterial.source_refs,
  ]).filter(isSafePublicRef);

  const recordWithoutFingerprint: Omit<
    OperatorApprovedSelectedSessionDigestIngestDecisionRecord,
    "record_fingerprint"
  > = {
    record_version:
      OPERATOR_APPROVED_SELECTED_SESSION_DIGEST_INGEST_DECISION_RECORD_VERSION,
    record_id: recordId,
    idempotency_key: validation.idempotency_key,
    created_at: validation.operator_approval.approved_at,
    scope: OPERATOR_APPROVED_SELECTED_SESSION_DIGEST_INGEST_DECISION_SCOPE,
    operator_decision: "approve_for_future_ingest_write",
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
    ingest_contract_preview_refs: preview.ingest_contract_preview_refs,
    approved_future_ingest_material: approvedFutureIngestMaterial,
    carry_forward_material: carryForwardMaterial,
    evidence_summary: preview.evidence_summary,
    write_validation: {
      validation_version:
        "operator_approved_selected_session_digest_ingest_decision_write_validation.v0.1",
      write_ready_revalidated: true,
      required_approval_requirements: [...preview.approval_requirements],
      checklist_confirmations_revalidated: true,
      refused_sample_fixture_default_or_smoke_material: false,
      refused_unrequested_side_effects: false,
      refused_actual_selected_digest_ingest: false,
      validation_hash: validationHash,
    },
    authority_boundary:
      createSelectedSessionDigestIngestDecisionWriteAuthorityBoundaryV01({
        writeNow: true,
      }),
    notes: uniqueSortedStrings([
      "Written only after operator approval and revalidation of the Selected Session Digest Ingest Operator Decision Preview.",
      "This record approves a future ingest decision only and does not create selected session digest ingest records or receipts.",
      ...(validation.input.notes ?? []),
    ]),
  };

  return {
    ...recordWithoutFingerprint,
    record_fingerprint: createRecordFingerprint(recordWithoutFingerprint),
  };
}

function buildApprovedFutureIngestMaterial(
  preview: SelectedSessionDigestIngestOperatorDecisionPreview,
): OperatorApprovedSelectedSessionDigestIngestDecisionApprovedFutureMaterial {
  const material = preview.would_write_decision_record_preview;
  return {
    proposed_future_ingest_record_kind:
      material.proposed_future_ingest_record_kind,
    proposed_future_ingest_receipt_kind:
      material.proposed_future_ingest_receipt_kind,
    selected_digest_candidate_refs: material.selected_digest_candidate_refs,
    selectable_digest_candidate_refs: material.selectable_digest_candidate_refs,
    candidate_counts_by_kind: material.candidate_counts_by_kind,
    source_kind: material.source_kind,
    source_ref: material.source_ref,
    operator_ref: material.operator_ref,
    session_ref: material.session_ref,
    project_ref: material.project_ref,
    source_refs: material.source_refs,
    evidence_refs: material.evidence_refs,
    contract_preview_ref: material.contract_preview_ref,
    intake_preview_ref: material.intake_preview_ref,
    privacy_review_confirmation_ref: material.privacy_review_confirmation_ref,
    requested_idempotency_key: material.requested_idempotency_key,
    requested_ingest_scope_ref: material.requested_ingest_scope_ref,
    sanitized_candidate_summaries: material.sanitized_candidate_summaries,
  };
}

function buildCarryForwardMaterial(
  preview: SelectedSessionDigestIngestOperatorDecisionPreview,
): OperatorApprovedSelectedSessionDigestIngestDecisionCarryForwardMaterial {
  return {
    review_only_candidate_refs:
      preview.candidate_carry_forward.review_only_candidate_refs,
    review_only_candidate_count:
      preview.candidate_carry_forward.review_only_candidate_count,
    review_only_candidate_summaries:
      preview.candidate_carry_forward.review_only_candidate_summaries,
    unresolved_contract_blockers:
      preview.candidate_carry_forward.unresolved_contract_blockers,
    contract_missing_evidence:
      preview.candidate_carry_forward.contract_missing_evidence,
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
  record: OperatorApprovedSelectedSessionDigestIngestDecisionRecord | null;
}): OperatorApprovedSelectedSessionDigestIngestDecisionWriteReceipt {
  const sourceRefs = uniqueSortedStrings([
    ...sourceRefsFromDecisionPreview(validation.decision_preview),
    ...(record?.source_refs ?? []),
  ]);
  return {
    receipt_version:
      OPERATOR_APPROVED_SELECTED_SESSION_DIGEST_INGEST_DECISION_WRITE_RECEIPT_VERSION,
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
      ? `${SELECTED_SESSION_DIGEST_INGEST_DECISION_WRITE_TABLE}:${record.record_id}`
      : null,
    source_refs: sourceRefs,
    no_side_effects: createNoSideEffectsV01(),
  };
}

function createRefusedReceipt(
  refusalReasons: string[],
  idempotencyKey: string | null,
): OperatorApprovedSelectedSessionDigestIngestDecisionWriteReceipt {
  return {
    receipt_version:
      OPERATOR_APPROVED_SELECTED_SESSION_DIGEST_INGEST_DECISION_WRITE_RECEIPT_VERSION,
    record_id: null,
    idempotency_key: idempotencyKey,
    wrote: false,
    idempotent_replay: false,
    created_at: new Date(0).toISOString(),
    refused: true,
    refusal_reasons: uniqueSortedStrings(refusalReasons),
    validation_hash: null,
    record_fingerprint: null,
    store_ref: null,
    source_refs: [],
    no_side_effects: createNoSideEffectsV01(),
  };
}

function storeResult(
  status: OperatorApprovedSelectedSessionDigestIngestDecisionWriteStatus,
  record: OperatorApprovedSelectedSessionDigestIngestDecisionRecord | null,
  records: OperatorApprovedSelectedSessionDigestIngestDecisionRecord[],
  receipt: OperatorApprovedSelectedSessionDigestIngestDecisionWriteReceipt,
): OperatorApprovedSelectedSessionDigestIngestDecisionStoreResult {
  return {
    store_version:
      OPERATOR_APPROVED_SELECTED_SESSION_DIGEST_INGEST_DECISION_STORE_VERSION,
    scope: OPERATOR_APPROVED_SELECTED_SESSION_DIGEST_INGEST_DECISION_SCOPE,
    status,
    ok:
      status === "written" ||
      status === "idempotent_existing" ||
      status === "read" ||
      status === "listed",
    record,
    records,
    receipt,
    error_code:
      status === "written" ||
      status === "idempotent_existing" ||
      status === "read" ||
      status === "listed"
        ? null
        : status,
    no_side_effects: createNoSideEffectsV01(),
  };
}

function rowToRecord(
  row: SelectedSessionDigestIngestDecisionWriteRow,
): OperatorApprovedSelectedSessionDigestIngestDecisionRecord {
  return JSON.parse(
    row.record_json,
  ) as OperatorApprovedSelectedSessionDigestIngestDecisionRecord;
}

function rowToReceipt(
  row: SelectedSessionDigestIngestDecisionWriteRow,
): OperatorApprovedSelectedSessionDigestIngestDecisionWriteReceipt {
  return JSON.parse(
    row.receipt_json,
  ) as OperatorApprovedSelectedSessionDigestIngestDecisionWriteReceipt;
}

function createNoSideEffectsV01(): OperatorApprovedSelectedSessionDigestIngestDecisionNoSideEffects {
  return {
    selected_session_digest_ingest_record_written: false,
    selected_session_digest_ingest_receipt_written: false,
    selected_session_digest_persisted: false,
    memory_mutated: false,
    current_working_perspective_updated: false,
    perspective_unit_written: false,
    next_work_bias_written: false,
    continuity_relay_written: false,
    handoff_context_mutated: false,
    selected_refs_written_to_live_handoff: false,
    handoff_sent: false,
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

function createRecordId(idempotencyKey: string): string {
  return `operator_approved_selected_session_digest_ingest_decision:${hashString(idempotencyKey).slice(0, 24)}`;
}

function createValidationHash(value: unknown): string {
  return `sha256:${hashString(stableStringify(value))}`;
}

function createRecordFingerprint(value: unknown): string {
  return `sha256:${hashString(stableStringify(value))}`;
}

function hashString(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, nested]) => `${JSON.stringify(key)}:${stableStringify(nested)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function sourceRefsFromDecisionPreview(
  preview: SelectedSessionDigestIngestOperatorDecisionPreview | null,
): string[] {
  if (!preview) return [];
  return uniqueSortedStrings([
    preview.preview_version,
    ...preview.source_refs,
    ...preview.ingest_contract_preview_refs.source_refs,
    ...preview.ingest_contract_preview_refs.evidence_refs,
    preview.ingest_contract_preview_refs.contract_preview_ref ?? "",
    preview.ingest_contract_preview_refs.intake_preview_ref ?? "",
  ]);
}

function collectUnsafePublicRefs(
  value: unknown,
  path = "input",
): Array<{ path: string }> {
  if (typeof value === "string") {
    return isSafePublicRef(value) ? [] : [{ path }];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      collectUnsafePublicRefs(item, `${path}[${index}]`),
    );
  }
  if (!isRecord(value)) return [];
  return Object.entries(value).flatMap(([key, nested]) => {
    if (
      key.toLowerCase().includes("summary") ||
      key.toLowerCase().includes("label") ||
      key.toLowerCase().includes("statement") ||
      key.toLowerCase().includes("notes")
    ) {
      return [];
    }
    if (
      key.toLowerCase().includes("ref") ||
      key.toLowerCase().includes("idempotency") ||
      key.toLowerCase().includes("approved_by") ||
      key.toLowerCase().includes("operator")
    ) {
      return collectUnsafePublicRefs(nested, `${path}.${key}`);
    }
    return [];
  });
}

function findRequestedSideEffectRefusals(value: unknown): string[] {
  if (value === undefined) return [];
  if (!isRecord(value)) return ["requested_side_effects_must_be_object"];
  const reasons: string[] = [];
  for (const [key, nested] of Object.entries(value)) {
    if (!allowedRequestedSideEffectKeys.has(key)) {
      reasons.push(`requested_side_effect_not_allowed:${key}`);
    }
    if (nested !== true) {
      reasons.push(`requested_side_effect_value_not_true:${key}`);
    }
    if (forbiddenSideEffectKeyPatterns.some((pattern) => pattern.test(key))) {
      reasons.push(`requested_side_effect_forbidden:${key}`);
    }
  }
  return uniqueSortedStrings(reasons);
}

function findForbiddenActionRequests(input: Record<string, unknown>): string[] {
  const json = JSON.stringify(input).toLowerCase();
  const reasons: string[] = [];
  for (const pattern of forbiddenSideEffectKeyPatterns) {
    if (pattern.test(json)) reasons.push("forbidden_actual_ingest_or_state_action_requested");
  }
  return uniqueSortedStrings(reasons);
}

function containsRawOrPrivateMarkers(value: unknown): boolean {
  return hasUnsafeTextMarker(JSON.stringify(value ?? {}));
}

function containsSampleDefaultOrSmokeMaterial(value: unknown): boolean {
  const json = JSON.stringify(value ?? {}).toLowerCase();
  return sampleDefaultOrSmokeMarkers.some((marker) => json.includes(marker));
}

function isDefaultWorkbenchMissingOrInsufficientMaterial(
  preview: Record<string, unknown> | null,
): boolean {
  if (!preview) return false;
  const refs = stringsFromArray(preview.source_refs).join(" ").toLowerCase();
  return (
    refs.includes("workbench:default") &&
    preview.decision_preview_status !==
      "ready_for_future_decision_record_write"
  );
}

function asSafePublicRef(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return isSafePublicRef(value) ? value : null;
}

function asNonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function asCleanStatement(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 500 || hasUnsafeTextMarker(trimmed)) {
    return null;
  }
  return trimmed;
}

function asStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function stringsFromArray(value: unknown): string[] {
  return asStringArray(value) ? value : [];
}

function arrayLength(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function getRecord(
  value: unknown,
  field: string,
): Record<string, unknown> | null {
  if (!isRecord(value)) return null;
  const nested = value[field];
  return isRecord(nested) ? nested : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function uniqueSortedStrings(values: readonly unknown[]): string[] {
  return Array.from(
    new Set(
      values
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ).sort();
}

function isSafePublicRef(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.length > 240) return false;
  if (trimmed !== value) return false;
  if (/[\r\n\t\0]/.test(trimmed)) return false;
  if (trimmed.startsWith("/") || /^[A-Za-z]:/.test(trimmed)) return false;
  if (trimmed.includes("..") || trimmed.includes("\\") || trimmed.includes("//")) {
    return false;
  }
  if (/(^|[:/@|=])(sk-|ghp_|github_pat_|xoxb-)/i.test(trimmed)) {
    return false;
  }
  if (/(^|[:|=])[a-z][a-z0-9+.-]*:\/\/[^/\s]+@/i.test(trimmed)) {
    return false;
  }
  return !hasUnsafeTextMarker(trimmed);
}

function hasUnsafeTextMarker(value: string): boolean {
  return (
    /(^|[:/@|=])(sk-|ghp_|github_pat_|xoxb-)/i.test(value) ||
    /(^|[:|=])[a-z][a-z0-9+.-]*:\/\/[^/\s]+@/i.test(value) ||
    /password:/i.test(value) ||
    /secret:/i.test(value) ||
    /\/Users\//.test(value) ||
    /\/home\//.test(value) ||
    /\.env/i.test(value) ||
    /raw_text/i.test(value) ||
    /raw_digest/i.test(value) ||
    /raw_excerpt/i.test(value)
  );
}
