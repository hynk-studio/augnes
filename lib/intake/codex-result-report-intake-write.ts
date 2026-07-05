import { createHash } from "node:crypto";

import {
  containsCandidateIngressUnsafeMarkerV01,
  isCandidateIngressPublicSafeRefV01,
  uniqueCandidateIngressStringsV01,
} from "@/lib/intake/candidate-ingress-normalizer";
import { CODEX_RESULT_REPORT_INTAKE_OPERATOR_DECISION_PREVIEW_VERSION } from "@/types/codex-result-report-intake-decision";
import {
  CODEX_RESULT_REPORT_INTAKE_RECEIPT_VERSION,
  CODEX_RESULT_REPORT_INTAKE_RECORD_VERSION,
  CODEX_RESULT_REPORT_INTAKE_SCOPE,
  CODEX_RESULT_REPORT_INTAKE_STORE_VERSION,
  type CodexResultReportIntakeNoSideEffects,
  type CodexResultReportIntakeRecord,
  type CodexResultReportIntakeReceipt,
  type CodexResultReportIntakeStoreResult,
  type CodexResultReportIntakeWriteAuthorityBoundary,
  type CodexResultReportIntakeWriteInput,
  type CodexResultReportIntakeWriteStatus,
} from "@/types/codex-result-report-intake-write";

export const CODEX_RESULT_REPORT_INTAKE_WRITE_TABLE =
  "codex_result_report_intake_records" as const;

export interface CodexResultReportIntakeWriteDbLike {
  exec(sql: string): unknown;
  prepare(sql: string): {
    run(...params: unknown[]): unknown;
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  };
}

export interface CodexResultReportIntakeWriteListOptions {
  idempotency_key?: string;
  operator_ref?: string;
  work_ref?: string;
  result_ref?: string;
  pr_ref?: string;
  limit?: number;
}

interface CodexResultReportIntakeWriteRow {
  record_id: string;
  idempotency_key: string;
  created_at: string;
  scope: string;
  operator_ref: string;
  work_ref: string | null;
  result_ref: string | null;
  pr_ref: string | null;
  commit_ref: string | null;
  source_ref: string;
  record_fingerprint: string;
  record_json: string;
  receipt_json: string;
}

interface ValidationResult {
  ok: boolean;
  refusal_reasons: string[];
  input: CodexResultReportIntakeWriteInput | null;
  idempotency_key: string | null;
}

const allowedRequestedSideEffectKeys = new Set([
  "can_write_db",
  "can_create_ingest_record",
  "can_create_ingest_receipt",
  "can_write_codex_result_report_candidate_record",
]);

const forbiddenRequestedSideEffectPatterns = [
  /memory/i,
  /current.*working.*perspective/i,
  /\bcwp\b/i,
  /perspective.*unit/i,
  /next.*work.*bias/i,
  /continuity.*relay/i,
  /handoff/i,
  /provider/i,
  /openai/i,
  /github/i,
  /execute.*codex|codex.*execute|codex_executed|can_execute_codex|codex product|codex runtime/i,
  /work.*episode/i,
  /expected.*observed/i,
  /reuse.*outcome/i,
  /dogfood.*metric/i,
  /\bpr\b.*create/i,
  /\bpr\b.*merge/i,
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

export const codexResultReportIntakeWriteSchemaSqlV01 = `
CREATE TABLE IF NOT EXISTS codex_result_report_intake_records (
  record_id TEXT PRIMARY KEY,
  idempotency_key TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL,
  scope TEXT NOT NULL,
  operator_ref TEXT NOT NULL,
  work_ref TEXT,
  result_ref TEXT,
  pr_ref TEXT,
  commit_ref TEXT,
  source_ref TEXT NOT NULL,
  record_fingerprint TEXT NOT NULL,
  record_json TEXT NOT NULL,
  receipt_json TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_codex_result_report_intake_records_scope_created
  ON codex_result_report_intake_records(scope, created_at, record_id);

CREATE INDEX IF NOT EXISTS idx_codex_result_report_intake_records_operator
  ON codex_result_report_intake_records(scope, operator_ref, created_at, record_id);

CREATE INDEX IF NOT EXISTS idx_codex_result_report_intake_records_work
  ON codex_result_report_intake_records(scope, work_ref, created_at, record_id);

CREATE INDEX IF NOT EXISTS idx_codex_result_report_intake_records_result
  ON codex_result_report_intake_records(scope, result_ref, created_at, record_id);

CREATE INDEX IF NOT EXISTS idx_codex_result_report_intake_records_pr
  ON codex_result_report_intake_records(scope, pr_ref, created_at, record_id);
`;

export function ensureCodexResultReportIntakeWriteSchemaV01(
  db: CodexResultReportIntakeWriteDbLike,
): void {
  db.exec(codexResultReportIntakeWriteSchemaSqlV01);
}

export function codexResultReportIntakeWriteSchemaExistsV01(
  db: CodexResultReportIntakeWriteDbLike,
): boolean {
  const row = db
    .prepare(
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name = ?`,
    )
    .get(CODEX_RESULT_REPORT_INTAKE_WRITE_TABLE) as { name?: string } | undefined;
  return row?.name === CODEX_RESULT_REPORT_INTAKE_WRITE_TABLE;
}

export function validateCodexResultReportIntakeWriteInputV01(
  input: unknown,
): ValidationResult {
  if (!isRecord(input)) {
    return validationResult({
      refusal_reasons: ["input_must_be_object"],
      input: null,
      idempotency_key: null,
    });
  }

  const reasons: string[] = [];
  const idempotencyKey = safeRef(input.idempotency_key);
  if (!idempotencyKey) reasons.push("idempotency_key_missing_or_invalid");
  reasons.push(...validateNotes(input.notes));
  const decisionPreview = getRecord(input, "decision_preview");
  reasons.push(...validateDecisionPreview(decisionPreview));
  const approval = getRecord(input, "operator_approval");
  reasons.push(...validateApproval({ approval, decisionPreview }));

  if (
    idempotencyKey &&
    typeof decisionPreview?.would_write_candidate_record_preview === "object"
  ) {
    const requested =
      getRecord(decisionPreview, "would_write_candidate_record_preview")
        ?.requested_idempotency_key;
    if (typeof requested === "string" && requested && requested !== idempotencyKey) {
      reasons.push("idempotency_key_mismatch_with_decision_preview");
    }
  }

  if (containsRawOrPrivateMarkers(input)) {
    reasons.push("raw_or_private_marker_material_refused");
  }
  if (containsSampleDefaultOrSmokeMaterial(input)) {
    reasons.push("sample_fixture_default_or_smoke_material_refused");
  }
  reasons.push(...findRequestedSideEffectRefusals(input.requested_side_effects));
  reasons.push(
    ...findForbiddenActionRequests({
      requested_side_effects: input.requested_side_effects,
      notes: input.notes,
    }),
  );

  return validationResult({
    refusal_reasons: uniqueCandidateIngressStringsV01(reasons),
    input:
      reasons.length === 0
        ? (input as unknown as CodexResultReportIntakeWriteInput)
        : null,
    idempotency_key: idempotencyKey,
  });
}

export function writeCodexResultReportIntakeRecordV01(
  input: unknown,
  options: { db: CodexResultReportIntakeWriteDbLike },
): CodexResultReportIntakeStoreResult {
  const validation = validateCodexResultReportIntakeWriteInputV01(input);
  if (!validation.ok || !validation.input || !validation.idempotency_key) {
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

  ensureCodexResultReportIntakeWriteSchemaV01(options.db);
  const record = buildCodexResultReportIntakeRecord(
    validation as ValidationResult & {
      ok: true;
      input: CodexResultReportIntakeWriteInput;
      idempotency_key: string;
    },
  );
  const existing = readCodexResultReportIntakeRecordByIdempotencyKeyV01(
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
        `INSERT INTO codex_result_report_intake_records (
          record_id,
          idempotency_key,
          created_at,
          scope,
          operator_ref,
          work_ref,
          result_ref,
          pr_ref,
          commit_ref,
          source_ref,
          record_fingerprint,
          record_json,
          receipt_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        record.record_id,
        record.idempotency_key,
        record.created_at,
        record.scope,
        record.operator_ref,
        record.work_ref,
        record.result_ref,
        record.pr_ref,
        record.commit_ref,
        record.source_ref,
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
        // Bounded refusal below covers rollback failure.
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

export function refuseCodexResultReportIntakeWriteV01(
  input: unknown,
  extraReasons: string[] = [],
): CodexResultReportIntakeStoreResult {
  const validation = validateCodexResultReportIntakeWriteInputV01(input);
  return storeResult(
    "refused",
    null,
    [],
    createReceipt({
      validation: {
        ...validation,
        ok: false,
        refusal_reasons: uniqueCandidateIngressStringsV01([
          ...validation.refusal_reasons,
          ...extraReasons,
        ]),
      },
      wrote: false,
      refused: true,
      idempotentReplay: false,
      record: null,
    }),
  );
}

export function readCodexResultReportIntakeRecordByIdV01(
  recordId: string,
  options: { db: CodexResultReportIntakeWriteDbLike },
): CodexResultReportIntakeStoreResult {
  if (!isCandidateIngressPublicSafeRefV01(recordId)) {
    return storeResult(
      "refused",
      null,
      [],
      createRefusedReceipt(["record_id_missing_or_invalid"], null),
    );
  }
  if (!codexResultReportIntakeWriteSchemaExistsV01(options.db)) {
    return storeResult(
      "schema_missing",
      null,
      [],
      createRefusedReceipt(["schema_missing"], null),
    );
  }
  const row = options.db
    .prepare(
      `SELECT * FROM codex_result_report_intake_records
       WHERE record_id = ? AND scope = ?`,
    )
    .get(recordId, CODEX_RESULT_REPORT_INTAKE_SCOPE) as
    | CodexResultReportIntakeWriteRow
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

export function readCodexResultReportIntakeRecordByIdempotencyKeyV01(
  idempotencyKey: string,
  options: { db: CodexResultReportIntakeWriteDbLike },
): CodexResultReportIntakeStoreResult {
  if (!isCandidateIngressPublicSafeRefV01(idempotencyKey)) {
    return storeResult(
      "refused",
      null,
      [],
      createRefusedReceipt(["idempotency_key_missing_or_invalid"], idempotencyKey),
    );
  }
  if (!codexResultReportIntakeWriteSchemaExistsV01(options.db)) {
    return storeResult(
      "schema_missing",
      null,
      [],
      createRefusedReceipt(["schema_missing"], idempotencyKey),
    );
  }
  const row = options.db
    .prepare(
      `SELECT * FROM codex_result_report_intake_records
       WHERE idempotency_key = ? AND scope = ?`,
    )
    .get(idempotencyKey, CODEX_RESULT_REPORT_INTAKE_SCOPE) as
    | CodexResultReportIntakeWriteRow
    | undefined;
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

export function listCodexResultReportIntakeRecordsV01(
  options: CodexResultReportIntakeWriteListOptions & {
    db: CodexResultReportIntakeWriteDbLike;
  },
): CodexResultReportIntakeStoreResult {
  if (!codexResultReportIntakeWriteSchemaExistsV01(options.db)) {
    return storeResult(
      "schema_missing",
      null,
      [],
      createRefusedReceipt(["schema_missing"], options.idempotency_key ?? null),
    );
  }
  const clauses = ["scope = ?"];
  const params: unknown[] = [CODEX_RESULT_REPORT_INTAKE_SCOPE];
  if (options.idempotency_key) {
    clauses.push("idempotency_key = ?");
    params.push(options.idempotency_key);
  }
  if (options.operator_ref) {
    clauses.push("operator_ref = ?");
    params.push(options.operator_ref);
  }
  if (options.work_ref) {
    clauses.push("work_ref = ?");
    params.push(options.work_ref);
  }
  if (options.result_ref) {
    clauses.push("result_ref = ?");
    params.push(options.result_ref);
  }
  if (options.pr_ref) {
    clauses.push("pr_ref = ?");
    params.push(options.pr_ref);
  }
  const limit = Math.max(1, Math.min(options.limit ?? 50, 100));
  const rows = options.db
    .prepare(
      `SELECT * FROM codex_result_report_intake_records
       WHERE ${clauses.join(" AND ")}
       ORDER BY created_at DESC, record_id DESC
       LIMIT ?`,
    )
    .all(...params, limit) as CodexResultReportIntakeWriteRow[];
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

export function createCodexResultReportIntakeWriteAuthorityBoundaryV01({
  writeNow,
}: {
  writeNow: boolean;
}): CodexResultReportIntakeWriteAuthorityBoundary {
  return {
    durable_local_codex_result_report_candidate_record: true,
    source_of_truth: false,
    candidate_record_only: true,
    can_write_db: writeNow,
    can_create_ingest_record: writeNow,
    can_create_ingest_receipt: writeNow,
    can_write_codex_result_report_candidate_record: writeNow,
    can_write_work_episode: false,
    can_write_expected_observed_delta: false,
    can_write_reuse_outcome_ledger: false,
    can_write_dogfood_metrics: false,
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
      "Authority is limited to one local Codex result report candidate ingest record and receipt.",
      "This writer cannot write WorkEpisode, ExpectedObservedDelta, reuse outcomes, dogfood metrics, memory, PerspectiveUnit, NextWorkBias, CWP, continuity relay, handoff state, providers, GitHub, Codex, or autonomous actions.",
    ],
  };
}

function validateDecisionPreview(preview: Record<string, unknown> | null): string[] {
  if (!preview) return ["decision_preview_missing"];
  const reasons: string[] = [];
  const previewSourceRefsRaw = Array.isArray(preview.source_refs)
    ? preview.source_refs
    : [];
  if (
    (preview.source_refs !== undefined && !Array.isArray(preview.source_refs)) ||
    previewSourceRefsRaw.some(
      (ref) =>
        typeof ref !== "string" || !isCandidateIngressPublicSafeRefV01(ref),
    )
  ) {
    reasons.push("decision_preview_source_refs_unsafe");
  }
  if (
    preview.preview_version !==
    CODEX_RESULT_REPORT_INTAKE_OPERATOR_DECISION_PREVIEW_VERSION
  ) {
    reasons.push("decision_preview_version_invalid");
  }
  if (preview.scope !== CODEX_RESULT_REPORT_INTAKE_SCOPE) {
    reasons.push("decision_preview_scope_invalid");
  }
  if (preview.decision_preview_status !== "ready_for_future_candidate_record_write") {
    reasons.push("decision_preview_not_ready_for_future_candidate_record_write");
  }
  if (
    preview.recommended_operator_decision !==
    "approve_for_codex_result_report_candidate_ingest"
  ) {
    reasons.push("decision_preview_recommended_decision_not_approve");
  }
  const writeReadiness = getRecord(preview, "write_readiness");
  if (
    !writeReadiness ||
    writeReadiness.write_ready !== true ||
    arrayLength(writeReadiness.current_blockers) > 0 ||
    arrayLength(writeReadiness.current_missing_evidence) > 0 ||
    arrayLength(writeReadiness.current_refusal_reasons) > 0 ||
    arrayLength(writeReadiness.current_insufficient_data) > 0
  ) {
    reasons.push("decision_preview_write_readiness_invalid");
  }
  const material = getRecord(preview, "would_write_candidate_record_preview");
  if (!material) {
    reasons.push("would_write_candidate_record_preview_missing");
  } else {
    const selectedRefsRaw = stringsFromArray(material.selected_candidate_refs);
    const selectableRefsRaw = stringsFromArray(material.selectable_candidate_refs);
    const evidenceRefsRaw = stringsFromArray(material.evidence_refs);
    const sourceRefsRaw = stringsFromArray(material.source_refs);
    const selectedRefs = selectedRefsRaw.filter(
      isCandidateIngressPublicSafeRefV01,
    );
    const selectableRefs = selectableRefsRaw.filter(
      isCandidateIngressPublicSafeRefV01,
    );
    const evidenceRefs = evidenceRefsRaw.filter(
      isCandidateIngressPublicSafeRefV01,
    );
    const sourceRefs = sourceRefsRaw.filter(
      isCandidateIngressPublicSafeRefV01,
    );
    if (
      selectedRefsRaw.some((ref) => !isCandidateIngressPublicSafeRefV01(ref))
    ) {
      reasons.push("selected_candidate_refs_unsafe");
    }
    if (
      selectableRefsRaw.some((ref) => !isCandidateIngressPublicSafeRefV01(ref))
    ) {
      reasons.push("selectable_candidate_refs_unsafe");
    }
    if (
      evidenceRefsRaw.some((ref) => !isCandidateIngressPublicSafeRefV01(ref))
    ) {
      reasons.push("evidence_refs_unsafe");
    }
    if (
      sourceRefsRaw.some((ref) => !isCandidateIngressPublicSafeRefV01(ref))
    ) {
      reasons.push("source_refs_unsafe");
    }
    if (selectedRefs.length === 0) reasons.push("selected_candidate_refs_missing");
    for (const ref of selectedRefs) {
      if (!selectableRefs.includes(ref)) {
        reasons.push("selected_candidate_refs_not_in_decision_preview");
      }
    }
    if (!safeRef(material.source_ref)) reasons.push("source_ref_missing");
    if (!safeRef(material.operator_ref)) reasons.push("operator_ref_missing");
    if (!safeRef(material.intake_preview_ref)) {
      reasons.push("intake_preview_ref_unsafe");
    }
    if (
      typeof material.project_ref === "string" &&
      material.project_ref.trim() &&
      !safeRef(material.project_ref)
    ) {
      reasons.push("project_ref_unsafe");
    }
    const workRef = safeRef(material.work_ref);
    const resultRef = safeRef(material.result_ref);
    if (!workRef && !resultRef) reasons.push("work_or_result_ref_missing");
    for (const field of ["pr_ref", "commit_ref"] as const) {
      const value = material[field];
      if (typeof value === "string" && value.trim() && !safeRef(value)) {
        reasons.push(`${field}_unsafe`);
      }
    }
    if (evidenceRefsRaw.length > 0 && evidenceRefs.length === 0) {
      reasons.push("evidence_refs_missing_after_safety_filter");
    }
    if (evidenceRefs.length === 0) {
      reasons.push("evidence_refs_missing");
    }
    if (sourceRefsRaw.length > 0 && sourceRefs.length === 0) {
      reasons.push("source_refs_missing_after_safety_filter");
    }
    if (!safeRef(material.privacy_review_confirmation_ref)) {
      reasons.push("privacy_review_confirmation_ref_missing");
    }
    if (!safeRef(material.requested_idempotency_key)) {
      reasons.push("requested_idempotency_key_missing");
    }
    if (!Array.isArray(material.sanitized_candidate_summaries)) {
      reasons.push("sanitized_candidate_summaries_missing_or_invalid");
    }
  }
  const authority = getRecord(preview, "authority_boundary");
  if (
    !authority ||
    authority.read_only !== true ||
    authority.advisory_only !== true ||
    authority.source_of_truth !== false ||
    authority.can_write_db !== false ||
    authority.can_create_ingest_record !== false ||
    authority.can_create_ingest_receipt !== false ||
    authority.can_write_work_episode !== false ||
    authority.can_write_expected_observed_delta !== false ||
    authority.can_write_reuse_outcome_ledger !== false ||
    authority.can_write_dogfood_metrics !== false ||
    authority.can_write_memory !== false ||
    authority.can_call_provider_openai !== false ||
    authority.can_call_github !== false ||
    authority.can_execute_codex !== false
  ) {
    reasons.push("decision_preview_authority_boundary_invalid");
  }
  const evidenceSummary = getRecord(preview, "evidence_summary");
  if (
    !evidenceSummary ||
    evidenceSummary.has_missing_evidence === true ||
    evidenceSummary.has_refusal_reasons === true ||
    evidenceSummary.has_unsafe_refs === true ||
    !Array.isArray(evidenceSummary.evidence_refs)
  ) {
    reasons.push("decision_preview_evidence_summary_invalid");
  }
  return uniqueCandidateIngressStringsV01(reasons);
}

function validateApproval({
  approval,
  decisionPreview,
}: {
  approval: Record<string, unknown> | null;
  decisionPreview: Record<string, unknown> | null;
}): string[] {
  if (!approval) return ["operator_approval_missing"];
  const reasons: string[] = [];
  if (
    approval.operator_decision !== "approve_for_codex_result_report_candidate_ingest"
  ) {
    reasons.push("operator_decision_invalid");
  }
  for (const field of ["approved_by", "operator_ref", "approved_at", "approval_statement"] as const) {
    if (!safeRef(approval[field])) reasons.push(`${field}_missing_or_invalid`);
  }
  const material = getRecord(decisionPreview, "would_write_candidate_record_preview");
  if (
    typeof material?.operator_ref === "string" &&
    typeof approval.operator_ref === "string" &&
    material.operator_ref !== approval.operator_ref
  ) {
    reasons.push("operator_ref_mismatch_with_decision_preview");
  }
  const checklistConfirmations = stringsFromArray(approval.checklist_confirmations);
  const requirements = stringsFromArray(decisionPreview?.approval_requirements);
  for (const requirement of requirements) {
    if (!checklistConfirmations.includes(requirement)) {
      reasons.push(`checklist_confirmation_missing:${requirement}`);
    }
  }
  if (requirements.length === 0 || checklistConfirmations.length === 0) {
    reasons.push("checklist_confirmations_missing");
  }
  return uniqueCandidateIngressStringsV01(reasons);
}

function buildCodexResultReportIntakeRecord(
  validation: ValidationResult & {
    ok: true;
    input: CodexResultReportIntakeWriteInput;
    idempotency_key: string;
  },
): CodexResultReportIntakeRecord {
  const decisionPreview = validation.input.decision_preview;
  const material = decisionPreview.would_write_candidate_record_preview;
  const createdAt = validation.input.operator_approval.approved_at;
  const validationHash = createValidationHash({
    decision_preview: decisionPreview,
    operator_approval: validation.input.operator_approval,
    idempotency_key: validation.idempotency_key,
  });
  const recordId = createRecordId(validation.idempotency_key);
  const evidenceRefs = uniqueCandidateIngressStringsV01(
    material.evidence_refs,
  ).filter(isCandidateIngressPublicSafeRefV01);
  const selectedCandidateRefs = uniqueCandidateIngressStringsV01(
    material.selected_candidate_refs,
  ).filter(isCandidateIngressPublicSafeRefV01);
  const sourceRefs = uniqueCandidateIngressStringsV01([
    CODEX_RESULT_REPORT_INTAKE_RECORD_VERSION,
    CODEX_RESULT_REPORT_INTAKE_STORE_VERSION,
    ...decisionPreview.source_refs,
    ...material.source_refs,
    ...evidenceRefs,
    ...selectedCandidateRefs,
    material.intake_preview_ref ?? "",
  ]).filter(isCandidateIngressPublicSafeRefV01);
  const recordWithoutFingerprint: Omit<CodexResultReportIntakeRecord, "record_fingerprint"> = {
    record_version: CODEX_RESULT_REPORT_INTAKE_RECORD_VERSION,
    record_id: recordId,
    idempotency_key: validation.idempotency_key,
    created_at: createdAt,
    scope: CODEX_RESULT_REPORT_INTAKE_SCOPE,
    source_refs: sourceRefs,
    evidence_refs: evidenceRefs,
    decision_preview_refs: {
      decision_preview_version: decisionPreview.preview_version,
      decision_preview_status: decisionPreview.decision_preview_status,
      recommended_operator_decision:
        decisionPreview.recommended_operator_decision,
    },
    intake_preview_refs: uniqueCandidateIngressStringsV01([
      material.intake_preview_ref ?? "",
    ]).filter(isCandidateIngressPublicSafeRefV01),
    source_kind: material.source_kind ?? "codex_result_report",
    source_ref: material.source_ref ?? "",
    operator_ref: material.operator_ref ?? "",
    project_ref: material.project_ref ?? null,
    work_ref: material.work_ref ?? null,
    result_ref: material.result_ref ?? null,
    pr_ref: material.pr_ref ?? null,
    commit_ref: material.commit_ref ?? null,
    selected_candidate_refs: selectedCandidateRefs,
    candidate_counts_by_kind: material.candidate_counts_by_kind,
    sanitized_candidate_summaries: material.sanitized_candidate_summaries,
    result_status_summary: summariesForKinds(material.sanitized_candidate_summaries, [
      "project_state_summary",
    ]),
    changed_files_summary: summariesForKinds(material.sanitized_candidate_summaries, [
      "changed_artifact_ref",
    ]),
    checks_summary: summariesForKinds(material.sanitized_candidate_summaries, [
      "expected_observed_signal",
    ]),
    skipped_checks_summary: summariesForKinds(material.sanitized_candidate_summaries, [
      "expected_observed_signal",
    ]).filter((summary) => /skip|not run/i.test(summary)),
    not_done_summary: summariesForKinds(material.sanitized_candidate_summaries, [
      "next_action",
    ]).filter((summary) => /not done|follow|next|remaining/i.test(summary)),
    requirement_progress_summary: summariesForKinds(material.sanitized_candidate_summaries, [
      "requirement",
    ]),
    expected_observed_signal_summary: summariesForKinds(material.sanitized_candidate_summaries, [
      "expected_observed_signal",
    ]),
    context_reuse_signal_summary: summariesForKinds(material.sanitized_candidate_summaries, [
      "reusable_context",
    ]),
    risk_or_regression_summary: summariesForKinds(material.sanitized_candidate_summaries, [
      "risk_or_blocker",
    ]),
    followup_summary: summariesForKinds(material.sanitized_candidate_summaries, [
      "next_action",
    ]),
    privacy_review_confirmation_ref:
      material.privacy_review_confirmation_ref ?? "",
    authority_profile: {
      durable_local_codex_result_report_candidate_record: true,
      source_of_truth: false,
      candidate_record_only: true,
      persistence_horizon: "local_project_candidate_record",
      dogfood_outcome_approval_performed: false,
      memory_promotion_performed: false,
      perspective_promotion_performed: false,
    },
    review_status: "ingested_as_candidate_record",
    persistence_horizon: "local_project_candidate_record",
    raw_material_policy: {
      raw_report_material_stored: false,
      raw_text_material_stored: false,
      raw_excerpt_material_stored: false,
      sanitized_candidate_summaries_only: true,
      private_or_secret_markers_allowed: false,
    },
    carry_forward_review_only_material: decisionPreview.candidate_carry_forward,
    no_promotion_performed: {
      work_episode_written: false,
      expected_observed_delta_written: false,
      reuse_outcome_ledger_written: false,
      dogfood_metrics_written: false,
      memory_promoted: false,
      current_working_perspective_updated: false,
      perspective_unit_written: false,
      next_work_bias_written: false,
      continuity_relay_written: false,
      handoff_context_mutated: false,
      selected_refs_written_to_live_handoff: false,
      handoff_sent: false,
    },
    write_validation: {
      validation_version: "codex_result_report_intake_write_validation.v0.1",
      decision_preview_revalidated: true,
      selected_candidate_refs_revalidated: true,
      refused_sample_fixture_default_or_smoke_material: false,
      refused_unrequested_side_effects: false,
      refused_memory_perspective_handoff_promotion: false,
      refused_dogfood_metric_reuse_or_work_episode_write: false,
      validation_hash: validationHash,
    },
    authority_boundary: createCodexResultReportIntakeWriteAuthorityBoundaryV01({
      writeNow: true,
    }),
    notes: validation.input.notes ?? [],
  };
  return {
    ...recordWithoutFingerprint,
    record_fingerprint: createRecordFingerprint(recordWithoutFingerprint),
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
  record: CodexResultReportIntakeRecord | null;
}): CodexResultReportIntakeReceipt {
  return {
    receipt_version: CODEX_RESULT_REPORT_INTAKE_RECEIPT_VERSION,
    record_id: record?.record_id ?? null,
    idempotency_key: validation.idempotency_key,
    wrote,
    idempotent_replay: idempotentReplay,
    created_at: record?.created_at ?? new Date(0).toISOString(),
    refused,
    refusal_reasons: uniqueCandidateIngressStringsV01(validation.refusal_reasons),
    validation_hash: validation.ok
      ? createValidationHash({
          input: validation.input,
          idempotency_key: validation.idempotency_key,
        })
      : null,
    record_fingerprint: record?.record_fingerprint ?? null,
    store_ref: record ? `codex_result_report_intake_record:${record.record_id}` : null,
    source_refs: record?.source_refs ?? [],
    no_side_effects: noSideEffects({
      wroteCodexResultReportRecord: wrote && !refused && !idempotentReplay,
    }),
  };
}

function createRefusedReceipt(
  refusalReasons: string[],
  idempotencyKey: string | null,
): CodexResultReportIntakeReceipt {
  return {
    receipt_version: CODEX_RESULT_REPORT_INTAKE_RECEIPT_VERSION,
    record_id: null,
    idempotency_key: idempotencyKey,
    wrote: false,
    idempotent_replay: false,
    created_at: new Date(0).toISOString(),
    refused: true,
    refusal_reasons: uniqueCandidateIngressStringsV01(refusalReasons),
    validation_hash: null,
    record_fingerprint: null,
    store_ref: null,
    source_refs: [],
    no_side_effects: noSideEffects({ wroteCodexResultReportRecord: false }),
  };
}

function storeResult(
  status: CodexResultReportIntakeWriteStatus,
  record: CodexResultReportIntakeRecord | null,
  records: CodexResultReportIntakeRecord[],
  receipt: CodexResultReportIntakeReceipt,
): CodexResultReportIntakeStoreResult {
  return {
    store_version: CODEX_RESULT_REPORT_INTAKE_STORE_VERSION,
    scope: CODEX_RESULT_REPORT_INTAKE_SCOPE,
    status,
    ok: ["written", "idempotent_existing", "read", "listed"].includes(status),
    record,
    records,
    receipt,
    error_code: ["written", "idempotent_existing", "read", "listed"].includes(status)
      ? null
      : status,
    no_side_effects: receipt.no_side_effects,
  };
}

function noSideEffects({
  wroteCodexResultReportRecord,
}: {
  wroteCodexResultReportRecord: boolean;
}): CodexResultReportIntakeNoSideEffects {
  return {
    codex_result_report_intake_record_written: wroteCodexResultReportRecord,
    codex_result_report_intake_receipt_written: wroteCodexResultReportRecord,
    codex_result_report_persisted_as_candidate_record: wroteCodexResultReportRecord,
    work_episode_residue_written: false,
    expected_observed_delta_written: false,
    reuse_outcome_ledger_written: false,
    dogfood_metrics_written: false,
    memory_mutated: false,
    current_working_perspective_updated: false,
    perspective_unit_written: false,
    next_work_bias_written: false,
    continuity_relay_written: false,
    handoff_context_mutated: false,
    selected_refs_written_to_live_handoff: false,
    handoff_sent: false,
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

function rowToRecord(row: CodexResultReportIntakeWriteRow): CodexResultReportIntakeRecord {
  return JSON.parse(row.record_json) as CodexResultReportIntakeRecord;
}

function rowToReceipt(row: CodexResultReportIntakeWriteRow): CodexResultReportIntakeReceipt {
  return JSON.parse(row.receipt_json) as CodexResultReportIntakeReceipt;
}

function summariesForKinds(
  summaries: unknown,
  kinds: string[],
): string[] {
  if (!Array.isArray(summaries)) return [];
  return summaries
    .filter((summary): summary is { candidate_kind: string; summary: string } =>
      isRecord(summary) &&
      typeof summary.candidate_kind === "string" &&
      typeof summary.summary === "string" &&
      kinds.includes(summary.candidate_kind) &&
      summary.summary.trim().length > 0,
    )
    .map((summary) => summary.summary)
    .slice(0, 20);
}

function validationResult({
  refusal_reasons,
  input,
  idempotency_key,
}: {
  refusal_reasons: string[];
  input: CodexResultReportIntakeWriteInput | null;
  idempotency_key: string | null;
}): ValidationResult {
  return {
    ok: refusal_reasons.length === 0,
    refusal_reasons,
    input,
    idempotency_key,
  };
}

function safeRef(value: unknown): string | null {
  return isCandidateIngressPublicSafeRefV01(value) ? value : null;
}

function validateNotes(value: unknown): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return ["notes_must_be_string_array"];
  return value.every((item) => typeof item === "string" && item.length <= 240 && !containsCandidateIngressUnsafeMarkerV01(item))
    ? []
    : ["notes_must_be_safe_string_array"];
}

function stringsFromArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function arrayLength(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function getRecord(
  value: unknown,
  key: string,
): Record<string, unknown> | null {
  if (!isRecord(value)) return null;
  const nested = value[key];
  return isRecord(nested) ? nested : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function createRecordId(idempotencyKey: string): string {
  return `codex_result_report_intake_record:${createHash("sha256")
    .update(idempotencyKey)
    .digest("hex")
    .slice(0, 20)}`;
}

function createValidationHash(value: unknown): string {
  return `validation:${createHash("sha256")
    .update(JSON.stringify(normalizeForHash(value)))
    .digest("hex")
    .slice(0, 24)}`;
}

function createRecordFingerprint(value: unknown): string {
  return `fingerprint:${createHash("sha256")
    .update(JSON.stringify(normalizeForHash(value)))
    .digest("hex")
    .slice(0, 32)}`;
}

function normalizeForHash(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeForHash);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, normalizeForHash(value[key])]),
  );
}

function containsRawOrPrivateMarkers(value: unknown): boolean {
  const text = JSON.stringify(value);
  return (
    /raw_text|raw_report|raw_digest|raw_excerpt|raw_history/i.test(text) ||
    containsCandidateIngressUnsafeMarkerV01(text)
  );
}

function containsSampleDefaultOrSmokeMaterial(value: unknown): boolean {
  const text = JSON.stringify(value).toLowerCase();
  return sampleDefaultOrSmokeMarkers.some((marker) => text.includes(marker));
}

function findRequestedSideEffectRefusals(value: unknown): string[] {
  if (value === undefined) return [];
  if (!isRecord(value)) return ["requested_side_effects_must_be_object"];
  const reasons: string[] = [];
  for (const [key, requested] of Object.entries(value)) {
    if (!allowedRequestedSideEffectKeys.has(key)) {
      reasons.push(`requested_side_effect_forbidden:${key}`);
    }
    if (requested !== true && requested !== false) {
      reasons.push(`requested_side_effect_value_invalid:${key}`);
    }
  }
  return uniqueCandidateIngressStringsV01(reasons);
}

function findForbiddenActionRequests(value: unknown): string[] {
  const text = JSON.stringify(value ?? {});
  return forbiddenRequestedSideEffectPatterns.some((pattern) => pattern.test(text))
    ? ["requested_side_effects_include_forbidden_authority"]
    : [];
}
