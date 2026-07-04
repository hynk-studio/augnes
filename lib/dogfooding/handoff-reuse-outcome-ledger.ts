import { createHash } from "node:crypto";

import {
  DOGFOOD_REUSE_OPERATOR_DECISION_PREVIEW_VERSION,
  type DogfoodReuseOperatorDecisionPreview,
} from "@/types/dogfood-reuse-operator-decision-preview";
import type {
  HandoffReuseOutcomeLedgerAuthorityBoundary,
  HandoffReuseOutcomeLedgerChecklistConfirmations,
  HandoffReuseOutcomeLedgerOperatorApproval,
  HandoffReuseOutcomeLedgerRecord,
  HandoffReuseOutcomeLedgerStoreResult,
  HandoffReuseOutcomeLedgerWriteInput,
  HandoffReuseOutcomeLedgerWriteReceipt,
  HandoffReuseOutcomeLedgerWriteStatus,
} from "@/types/handoff-reuse-outcome-ledger";
import {
  HANDOFF_REUSE_OUTCOME_LEDGER_RECORD_VERSION,
  HANDOFF_REUSE_OUTCOME_LEDGER_SCOPE,
  HANDOFF_REUSE_OUTCOME_LEDGER_STORE_VERSION,
  HANDOFF_REUSE_OUTCOME_LEDGER_WRITE_RECEIPT_VERSION,
} from "@/types/handoff-reuse-outcome-ledger";

export const HANDOFF_REUSE_OUTCOME_LEDGER_TABLE =
  "handoff_reuse_outcome_ledger_records" as const;

export interface HandoffReuseOutcomeLedgerDbLike {
  exec(sql: string): unknown;
  prepare(sql: string): {
    run(...params: unknown[]): unknown;
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  };
}

export interface HandoffReuseOutcomeLedgerListFilters {
  idempotency_key?: string;
  result_report_ref?: string;
  operator_ref?: string;
  limit?: number;
}

interface LedgerRow {
  record_id: string;
  idempotency_key: string;
  scope: string;
  record_version: string;
  store_version: string;
  operator_decision: string;
  approved_by: string;
  approved_at: string;
  result_report_ref: string;
  result_report_fingerprint: string;
  proposed_record_kind: string;
  record_fingerprint: string;
  source_refs_json: string;
  record_json: string;
  receipt_json: string;
  created_at: string;
}

interface ValidationResult {
  ok: boolean;
  refusal_reasons: string[];
  input: HandoffReuseOutcomeLedgerWriteInput | null;
  decision_preview: DogfoodReuseOperatorDecisionPreview | null;
  idempotency_key: string | null;
  approved_by: string | null;
  operator_ref: string | null;
  approved_at: string | null;
}

const requiredChecklistFields = [
  "actual_result_report_confirmed",
  "result_matches_intended_codex_run",
  "changed_files_and_checks_confirmed",
  "skipped_checks_reviewed_not_counted_as_success",
  "reuse_classifications_evidence_backed",
  "unknown_refs_remain_unknown",
  "carry_forward_candidates_are_candidate_only",
  "no_durable_memory_or_perspective_apply",
  "no_metric_update_expected",
] as const satisfies readonly (keyof HandoffReuseOutcomeLedgerChecklistConfirmations)[];

const previewForbiddenAuthorityFields = [
  "can_persist_decision",
  "can_write_db",
  "can_write_dogfood_ledger",
  "can_update_metrics",
  "can_mutate_memory",
  "can_promote_memory",
  "can_apply_project_perspective",
  "can_create_promotion_decision",
  "can_create_formation_receipt",
  "can_call_provider_openai",
  "can_call_github",
  "can_execute_codex",
  "can_send_handoff",
  "can_create_pr",
  "can_merge_pr",
  "can_run_autonomous_action",
  "can_create_graph_or_vector_store",
  "can_create_rag_stack",
  "can_crawl_or_observe_browser",
] as const;

const forbiddenActionKeyPatterns = [
  /metric.*update/i,
  /update.*metric/i,
  /can_update_metrics/i,
  /mutate.*memory/i,
  /memory.*mutation/i,
  /can_mutate_memory/i,
  /promote.*memory/i,
  /perspective.*apply/i,
  /apply.*perspective/i,
  /promotion.*decision/i,
  /formation.*receipt/i,
  /provider.*call/i,
  /openai.*call/i,
  /github.*call/i,
  /execute.*codex/i,
  /codex.*execution/i,
  /send.*handoff/i,
  /handoff.*send/i,
  /route.*namespace.*cleanup/i,
  /graph.*store/i,
  /vector.*store/i,
  /rag.*stack/i,
  /crawl/i,
  /browser.*observer/i,
  /autonomous.*action/i,
  /autonomous.*runner/i,
] as const;

const sampleFixtureMarkers = [
  "codex-result-report:sample-safe",
  "sample-codex-result-report",
  "sample-public-safe",
  "operator-ref:sample-human-reviewer",
  "fixtures/codex-result-report-ingestion.sample.v0.1.json",
  "codex-result-report-ingestion.sample.v0.1",
] as const;

const privateRefMarkers = [
  "/users/",
  "/home/",
  "file://",
  "sk-",
  "ghp_",
  "openai_api_key",
  "github_token",
  "password:",
  "secret:",
] as const;

export const handoffReuseOutcomeLedgerStoreSchemaSqlV01 = `
CREATE TABLE IF NOT EXISTS handoff_reuse_outcome_ledger_records (
  record_id text primary key,
  idempotency_key text not null unique,
  scope text not null,
  record_version text not null,
  store_version text not null,
  operator_decision text not null,
  approved_by text not null,
  approved_at text not null,
  result_report_ref text not null,
  result_report_fingerprint text not null,
  proposed_record_kind text not null,
  record_fingerprint text not null,
  source_refs_json text not null,
  record_json text not null,
  receipt_json text not null,
  created_at text not null
);

CREATE INDEX IF NOT EXISTS idx_handoff_reuse_outcome_ledger_result
  ON handoff_reuse_outcome_ledger_records(scope, result_report_ref, created_at, record_id);

CREATE INDEX IF NOT EXISTS idx_handoff_reuse_outcome_ledger_operator
  ON handoff_reuse_outcome_ledger_records(scope, approved_by, created_at, record_id);
`;

export function ensureHandoffReuseOutcomeLedgerStoreSchemaV01(
  db: HandoffReuseOutcomeLedgerDbLike,
): void {
  db.exec(handoffReuseOutcomeLedgerStoreSchemaSqlV01);
}

export function handoffReuseOutcomeLedgerStoreSchemaExistsV01(
  db: HandoffReuseOutcomeLedgerDbLike,
): boolean {
  const row = db
    .prepare(
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name = ?`,
    )
    .get(HANDOFF_REUSE_OUTCOME_LEDGER_TABLE) as { name?: string } | undefined;
  return row?.name === HANDOFF_REUSE_OUTCOME_LEDGER_TABLE;
}

export function validateHandoffReuseOutcomeLedgerWriteInputV01(
  input: unknown,
): ValidationResult {
  const reasons: string[] = [];
  if (!isRecord(input)) {
    return validationResult({
      refusal_reasons: ["input_must_be_object"],
      input: null,
      decision_preview: null,
      idempotency_key: null,
      approved_by: null,
      operator_ref: null,
      approved_at: null,
    });
  }

  const decisionPreview = isRecord(input.decision_preview)
    ? (input.decision_preview as unknown as DogfoodReuseOperatorDecisionPreview)
    : null;
  if (!decisionPreview) reasons.push("decision_preview_missing");
  if (
    decisionPreview &&
    decisionPreview.preview_version !== DOGFOOD_REUSE_OPERATOR_DECISION_PREVIEW_VERSION
  ) {
    reasons.push("decision_preview_version_invalid");
  }
  if (decisionPreview?.write_readiness?.write_ready !== true) {
    reasons.push("decision_preview_not_write_ready");
  }
  if (decisionPreview?.decision_preview_status !== "ready_for_operator_decision") {
    reasons.push("decision_preview_status_not_ready_for_operator_decision");
  }
  if (
    decisionPreview?.recommended_operator_decision !==
    "approve_for_future_write"
  ) {
    reasons.push("recommended_operator_decision_not_approve_for_future_write");
  }

  if (input.operator_decision !== "approve_for_future_write") {
    reasons.push("operator_decision_not_approve_for_future_write");
  }

  const idempotencyKey = asNonEmptyString(input.idempotency_key);
  if (!idempotencyKey || !isSafePublicRef(idempotencyKey)) {
    reasons.push("idempotency_key_missing_or_invalid");
  }

  const approvedBy =
    asNonEmptyString(input.approved_by) ?? asNonEmptyString(input.operator_ref);
  const operatorRef = asNonEmptyString(input.operator_ref) ?? approvedBy;
  if (!approvedBy || !operatorRef) {
    reasons.push("operator_approval_actor_missing");
  }

  const approvedAt = asNonEmptyString(input.approved_at);
  if (!approvedAt || !Number.isFinite(Date.parse(approvedAt))) {
    reasons.push("approved_at_missing_or_invalid");
  }

  const checklist = isRecord(input.checklist_confirmations)
    ? input.checklist_confirmations
    : null;
  if (!checklist) {
    reasons.push("checklist_confirmations_missing");
  }
  for (const field of requiredChecklistFields) {
    if (checklist?.[field] !== true) {
      reasons.push(`checklist_confirmation_missing:${field}`);
    }
  }

  if ((decisionPreview?.blocking_reasons.length ?? 0) > 0) {
    reasons.push("decision_preview_blocking_reasons_present");
  }
  if ((decisionPreview?.missing_evidence.length ?? 0) > 0) {
    reasons.push("decision_preview_missing_evidence_present");
  }
  if (decisionPreview?.source_status.codex_result_report !== "supplied") {
    reasons.push("codex_result_report_not_supplied");
  }

  const proposalRefs = decisionPreview?.proposal_refs;
  if (!proposalRefs?.result_report_ref) {
    reasons.push("result_report_ref_missing");
  }
  if (!proposalRefs?.result_report_fingerprint) {
    reasons.push("result_report_fingerprint_missing");
  }
  if (proposalRefs?.proposal_status !== "proposal_ready_for_operator_review") {
    reasons.push("proposal_status_not_ready_for_operator_review");
  }
  if (!proposalRefs?.feedback_draft_ref) {
    reasons.push("feedback_draft_ref_missing");
  }
  if (!proposalRefs?.context_relay_rationale_ref) {
    reasons.push("context_relay_rationale_ref_missing");
  }
  if (!proposalRefs?.continuity_relay_ref) {
    reasons.push("continuity_relay_ref_missing");
  }
  if (!decisionPreview?.would_write_preview.proposed_record_kind) {
    reasons.push("proposed_record_kind_missing");
  }
  if (!decisionPreview?.would_write_preview.proposed_expected_observed_summary) {
    reasons.push("expected_observed_summary_missing");
  }
  if (!decisionPreview?.would_write_preview.proposed_reuse_classifications) {
    reasons.push("reuse_classifications_missing");
  }

  const authorityBoundary = decisionPreview?.authority_boundary;
  if (
    authorityBoundary?.read_only !== true ||
    authorityBoundary?.candidate_material_only !== true ||
    authorityBoundary?.source_of_truth !== false
  ) {
    reasons.push("decision_preview_authority_boundary_invalid");
  }
  for (const field of previewForbiddenAuthorityFields) {
    if (authorityBoundary && authorityBoundary[field] !== false) {
      reasons.push(`decision_preview_authority_field_not_false:${field}`);
    }
  }

  if (decisionPreview && isSampleFixtureBacked(decisionPreview)) {
    reasons.push("sample_fixture_backed_preview_refused");
  }
  if (decisionPreview && isDefaultWorkbenchMissingResultPath(decisionPreview)) {
    reasons.push("default_workbench_missing_result_path_refused");
  }

  reasons.push(...findForbiddenActionRequests(input));

  return validationResult({
    refusal_reasons: uniqueSortedStrings(reasons),
    input:
      reasons.length === 0
        ? (input as unknown as HandoffReuseOutcomeLedgerWriteInput)
        : null,
    decision_preview: decisionPreview,
    idempotency_key: idempotencyKey,
    approved_by: approvedBy,
    operator_ref: operatorRef,
    approved_at: approvedAt,
  });
}

export function writeHandoffReuseOutcomeLedgerRecordV01(
  input: unknown,
  db: HandoffReuseOutcomeLedgerDbLike,
): HandoffReuseOutcomeLedgerStoreResult {
  const validation = validateHandoffReuseOutcomeLedgerWriteInputV01(input);
  if (!validation.ok || !validation.input || !validation.decision_preview) {
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

  ensureHandoffReuseOutcomeLedgerStoreSchemaV01(db);
  const validated = validation as ValidationResult & {
    ok: true;
    input: HandoffReuseOutcomeLedgerWriteInput;
    decision_preview: DogfoodReuseOperatorDecisionPreview;
    idempotency_key: string;
    approved_by: string;
    operator_ref: string;
    approved_at: string;
  };
  const record = buildLedgerRecord(validated);
  const existing = readHandoffReuseOutcomeLedgerRecordByIdempotencyKeyV01(
    record.idempotency_key,
    db,
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
    db.prepare("BEGIN IMMEDIATE").run();
    transactionStarted = true;
    db.prepare(
      `INSERT INTO handoff_reuse_outcome_ledger_records (
        record_id,
        idempotency_key,
        scope,
        record_version,
        store_version,
        operator_decision,
        approved_by,
        approved_at,
        result_report_ref,
        result_report_fingerprint,
        proposed_record_kind,
        record_fingerprint,
        source_refs_json,
        record_json,
        receipt_json,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      record.record_id,
      record.idempotency_key,
      record.scope,
      record.record_version,
      record.store_version,
      record.operator_decision,
      record.operator_approval.approved_by,
      record.operator_approval.approved_at,
      record.result_report_ref,
      record.result_report_fingerprint,
      record.proposed_record_kind,
      record.record_fingerprint,
      JSON.stringify(record.source_refs),
      JSON.stringify(record),
      JSON.stringify(receipt),
      record.created_at,
    );
    db.prepare("COMMIT").run();
    transactionStarted = false;
    return storeResult("written", record, [record], receipt);
  } catch {
    if (transactionStarted) {
      try {
        db.prepare("ROLLBACK").run();
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

export function refuseHandoffReuseOutcomeLedgerWriteV01(
  input: unknown,
  extraReasons: string[] = [],
): HandoffReuseOutcomeLedgerStoreResult {
  const validation = validateHandoffReuseOutcomeLedgerWriteInputV01(input);
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

export function readHandoffReuseOutcomeLedgerRecordV01(
  recordId: string,
  db: HandoffReuseOutcomeLedgerDbLike,
): HandoffReuseOutcomeLedgerStoreResult {
  if (!isSafePublicRef(recordId)) {
    return storeResult(
      "refused",
      null,
      [],
      createRefusedReceipt(["record_id_missing_or_invalid"], null),
    );
  }
  if (!handoffReuseOutcomeLedgerStoreSchemaExistsV01(db)) {
    return storeResult(
      "schema_missing",
      null,
      [],
      createRefusedReceipt(["schema_missing"], null),
    );
  }
  const row = db
    .prepare(
      `SELECT * FROM handoff_reuse_outcome_ledger_records
       WHERE record_id = ? AND scope = ?`,
    )
    .get(recordId, HANDOFF_REUSE_OUTCOME_LEDGER_SCOPE) as LedgerRow | undefined;
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

export function readHandoffReuseOutcomeLedgerRecordByIdempotencyKeyV01(
  idempotencyKey: string,
  db: HandoffReuseOutcomeLedgerDbLike,
): HandoffReuseOutcomeLedgerStoreResult {
  if (!isSafePublicRef(idempotencyKey)) {
    return storeResult(
      "refused",
      null,
      [],
      createRefusedReceipt(["idempotency_key_missing_or_invalid"], idempotencyKey),
    );
  }
  if (!handoffReuseOutcomeLedgerStoreSchemaExistsV01(db)) {
    return storeResult(
      "schema_missing",
      null,
      [],
      createRefusedReceipt(["schema_missing"], idempotencyKey),
    );
  }
  const row = db
    .prepare(
      `SELECT * FROM handoff_reuse_outcome_ledger_records
       WHERE idempotency_key = ? AND scope = ?`,
    )
    .get(idempotencyKey, HANDOFF_REUSE_OUTCOME_LEDGER_SCOPE) as
    | LedgerRow
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

export function listHandoffReuseOutcomeLedgerRecordsV01(
  filters: HandoffReuseOutcomeLedgerListFilters,
  db: HandoffReuseOutcomeLedgerDbLike,
): HandoffReuseOutcomeLedgerStoreResult {
  if (!handoffReuseOutcomeLedgerStoreSchemaExistsV01(db)) {
    return storeResult(
      "schema_missing",
      null,
      [],
      createRefusedReceipt(["schema_missing"], filters.idempotency_key ?? null),
    );
  }
  const clauses = ["scope = ?"];
  const params: unknown[] = [HANDOFF_REUSE_OUTCOME_LEDGER_SCOPE];
  if (filters.idempotency_key) {
    clauses.push("idempotency_key = ?");
    params.push(filters.idempotency_key);
  }
  if (filters.result_report_ref) {
    clauses.push("result_report_ref = ?");
    params.push(filters.result_report_ref);
  }
  if (filters.operator_ref) {
    clauses.push("approved_by = ?");
    params.push(filters.operator_ref);
  }
  const limit = Math.max(1, Math.min(filters.limit ?? 50, 100));
  const rows = db
    .prepare(
      `SELECT * FROM handoff_reuse_outcome_ledger_records
       WHERE ${clauses.join(" AND ")}
       ORDER BY created_at ASC, record_id ASC
       LIMIT ?`,
    )
    .all(...params, limit) as LedgerRow[];
  const records = rows.map(rowToRecord);
  return storeResult(
    "listed",
    records[0] ?? null,
    records,
    rows[0]?.receipt_json
      ? rowToReceipt(rows[0])
      : createRefusedReceipt([], filters.idempotency_key ?? null),
  );
}

export function createHandoffReuseOutcomeLedgerAuthorityBoundaryV01({
  writeNow,
}: {
  writeNow: boolean;
}): HandoffReuseOutcomeLedgerAuthorityBoundary {
  return {
    ledger_record_only: true,
    source_of_truth: false,
    operator_approved_durable_local_record: true,
    can_write_handoff_reuse_ledger: writeNow,
    can_write_db: writeNow,
    can_write_dogfood_ledger: writeNow,
    can_update_metrics: false,
    can_mutate_memory: false,
    can_promote_memory: false,
    can_apply_project_perspective: false,
    can_create_promotion_decision: false,
    can_create_formation_receipt: false,
    can_call_provider_openai: false,
    can_call_github: false,
    can_execute_codex: false,
    can_send_handoff: false,
    can_create_pr: false,
    can_merge_pr: false,
    can_run_autonomous_action: false,
    can_create_graph_or_vector_store: false,
    can_create_rag_stack: false,
    can_crawl_or_observe_browser: false,
    notes: [
      "Authority is limited to one operator-approved local handoff reuse outcome ledger record.",
      "No metric, memory, Perspective, promotion, Formation Receipt, provider, GitHub, Codex, handoff send, graph/vector/RAG/crawler/browser observer, or autonomous action is authorized.",
    ],
  };
}

function buildLedgerRecord(
  validation: ValidationResult & {
    ok: true;
    input: HandoffReuseOutcomeLedgerWriteInput;
    decision_preview: DogfoodReuseOperatorDecisionPreview;
    idempotency_key: string;
    approved_by: string;
    operator_ref: string;
    approved_at: string;
  },
): HandoffReuseOutcomeLedgerRecord {
  const preview = validation.decision_preview;
  const approval: HandoffReuseOutcomeLedgerOperatorApproval = {
    approved_by: validation.approved_by,
    operator_ref: validation.operator_ref,
    approved_at: validation.approved_at,
    checklist_confirmations: validation.input.checklist_confirmations,
    review_note: asNonEmptyString(validation.input.review_note) ?? null,
  };
  const resultReportRef = preview.proposal_refs.result_report_ref!;
  const resultReportFingerprint = preview.proposal_refs.result_report_fingerprint!;
  const validationHash = createValidationHash({ preview, approval });
  const recordId = createRecordId(validation.idempotency_key);
  const sourceRefs = uniqueSortedStrings([
    HANDOFF_REUSE_OUTCOME_LEDGER_RECORD_VERSION,
    HANDOFF_REUSE_OUTCOME_LEDGER_STORE_VERSION,
    preview.preview_version,
    ...preview.source_refs,
    ...preview.proposal_refs.source_refs,
    preview.proposal_refs.proposal_ref ?? "",
    preview.proposal_refs.feedback_draft_ref ?? "",
    `codex-result-report:${resultReportRef}`,
    `codex-result-report-fingerprint:${resultReportFingerprint}`,
    preview.proposal_refs.context_relay_rationale_ref ?? "",
    preview.proposal_refs.continuity_relay_ref ?? "",
  ]);

  const recordWithoutFingerprint: Omit<
    HandoffReuseOutcomeLedgerRecord,
    "record_fingerprint"
  > = {
    record_version: HANDOFF_REUSE_OUTCOME_LEDGER_RECORD_VERSION,
    store_version: HANDOFF_REUSE_OUTCOME_LEDGER_STORE_VERSION,
    record_id: recordId,
    idempotency_key: validation.idempotency_key,
    created_at: validation.approved_at,
    scope: HANDOFF_REUSE_OUTCOME_LEDGER_SCOPE,
    operator_decision: "approve_for_future_write",
    operator_approval: approval,
    source_refs: sourceRefs,
    decision_preview_refs: {
      preview_version: preview.preview_version,
      preview_status: preview.decision_preview_status,
      recommended_operator_decision: preview.recommended_operator_decision,
      write_ready: preview.write_readiness.write_ready,
      preview_as_of: preview.as_of,
      source_refs: preview.source_refs,
    },
    proposal_refs: preview.proposal_refs,
    feedback_draft_refs: {
      feedback_draft_ref: preview.proposal_refs.feedback_draft_ref,
      result_report_ref: resultReportRef,
      result_report_fingerprint: resultReportFingerprint,
      context_relay_rationale_ref:
        preview.proposal_refs.context_relay_rationale_ref,
      continuity_relay_ref: preview.proposal_refs.continuity_relay_ref,
      source_refs: preview.proposal_refs.source_refs,
    },
    result_report_ref: resultReportRef,
    result_report_fingerprint: resultReportFingerprint,
    context_relay_rationale_ref:
      preview.proposal_refs.context_relay_rationale_ref!,
    continuity_relay_ref: preview.proposal_refs.continuity_relay_ref!,
    proposed_record_kind: preview.would_write_preview.proposed_record_kind!,
    dogfood_signal: preview.would_write_preview.proposed_dogfood_signal_summary,
    reuse_classifications:
      preview.would_write_preview.proposed_reuse_classifications!,
    expected_observed_summary:
      preview.would_write_preview.proposed_expected_observed_summary!,
    skipped_or_unverified_checks:
      preview.would_write_preview.proposed_dogfood_signal_summary
        .skipped_or_unverified_checks,
    not_done_items:
      preview.would_write_preview.proposed_dogfood_signal_summary.not_done_items,
    carry_forward_candidates:
      preview.would_write_preview.carry_forward_candidates,
    evidence_summary: preview.evidence_summary,
    write_validation: {
      validation_version:
        "handoff_reuse_outcome_ledger_write_validation.v0.1",
      write_ready_revalidated: true,
      required_checklist_confirmations: [...requiredChecklistFields],
      refused_sample_fixture_material: false,
      default_workbench_missing_result_refused: false,
      validation_hash: validationHash,
    },
    authority_boundary: createHandoffReuseOutcomeLedgerAuthorityBoundaryV01({
      writeNow: true,
    }),
    notes: [
      "Written only after operator approval and revalidation of the Dogfood Reuse Operator Decision Preview.",
      "Skipped checks remain skipped/unverified and are not counted as success.",
      "Carry-forward candidates remain candidate-only.",
    ],
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
  record: HandoffReuseOutcomeLedgerRecord | null;
}): HandoffReuseOutcomeLedgerWriteReceipt {
  const sourceRefs = uniqueSortedStrings([
    ...(validation.decision_preview?.source_refs ?? []),
    ...(record?.source_refs ?? []),
  ]);
  return {
    receipt_version: HANDOFF_REUSE_OUTCOME_LEDGER_WRITE_RECEIPT_VERSION,
    record_id: record?.record_id ?? null,
    idempotency_key: validation.idempotency_key,
    wrote,
    idempotent_replay: idempotentReplay,
    created_at: validation.approved_at ?? new Date(0).toISOString(),
    refused,
    refusal_reasons: refused ? validation.refusal_reasons : [],
    validation_hash: record?.write_validation.validation_hash ?? null,
    record_fingerprint: record?.record_fingerprint ?? null,
    store_ref: record
      ? `${HANDOFF_REUSE_OUTCOME_LEDGER_TABLE}:${record.record_id}`
      : null,
    source_refs: sourceRefs,
    no_metric_update: true,
    no_memory_mutation: true,
    no_perspective_apply: true,
    no_provider_call: true,
    no_github_call: true,
    no_codex_execution: true,
    no_handoff_send: true,
  };
}

function createRefusedReceipt(
  refusalReasons: string[],
  idempotencyKey: string | null,
): HandoffReuseOutcomeLedgerWriteReceipt {
  return {
    receipt_version: HANDOFF_REUSE_OUTCOME_LEDGER_WRITE_RECEIPT_VERSION,
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
    no_metric_update: true,
    no_memory_mutation: true,
    no_perspective_apply: true,
    no_provider_call: true,
    no_github_call: true,
    no_codex_execution: true,
    no_handoff_send: true,
  };
}

function storeResult(
  status: HandoffReuseOutcomeLedgerWriteStatus,
  record: HandoffReuseOutcomeLedgerRecord | null,
  records: HandoffReuseOutcomeLedgerRecord[],
  receipt: HandoffReuseOutcomeLedgerWriteReceipt,
): HandoffReuseOutcomeLedgerStoreResult {
  const ok = ["written", "idempotent_existing", "read", "listed"].includes(
    status,
  );
  return {
    store_version: HANDOFF_REUSE_OUTCOME_LEDGER_STORE_VERSION,
    scope: HANDOFF_REUSE_OUTCOME_LEDGER_SCOPE,
    status,
    ok,
    record,
    records,
    receipt,
    error_code: ok ? null : status,
    no_metric_update: true,
    no_memory_mutation: true,
    no_perspective_apply: true,
    no_provider_call: true,
    no_github_call: true,
    no_codex_execution: true,
    no_handoff_send: true,
    no_formation_receipt: true,
    no_promotion_decision: true,
    no_graph_vector_rag_crawler_observer: true,
    no_autonomous_action: true,
  };
}

function validationResult({
  refusal_reasons,
  input,
  decision_preview,
  idempotency_key,
  approved_by,
  operator_ref,
  approved_at,
}: Omit<ValidationResult, "ok">): ValidationResult {
  return {
    ok: refusal_reasons.length === 0,
    refusal_reasons,
    input,
    decision_preview,
    idempotency_key,
    approved_by,
    operator_ref,
    approved_at,
  };
}

function rowToRecord(row: LedgerRow): HandoffReuseOutcomeLedgerRecord {
  return JSON.parse(row.record_json) as HandoffReuseOutcomeLedgerRecord;
}

function rowToReceipt(row: LedgerRow): HandoffReuseOutcomeLedgerWriteReceipt {
  return JSON.parse(row.receipt_json) as HandoffReuseOutcomeLedgerWriteReceipt;
}

function createRecordId(idempotencyKey: string): string {
  return `handoff-reuse-outcome-ledger-record:${sha256(idempotencyKey).slice(
    0,
    24,
  )}`;
}

function createValidationHash(value: unknown): string {
  return `sha256:${sha256(stableStringify(value))}`;
}

function createRecordFingerprint(
  record: Omit<HandoffReuseOutcomeLedgerRecord, "record_fingerprint">,
): string {
  return `sha256:${sha256(stableStringify(record))}`;
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function isDefaultWorkbenchMissingResultPath(
  preview: DogfoodReuseOperatorDecisionPreview,
): boolean {
  return (
    preview.source_status.codex_result_report === "missing" ||
    preview.proposal_refs.result_report_ref === null ||
    preview.proposal_refs.result_report_fingerprint === null
  );
}

function isSampleFixtureBacked(value: unknown): boolean {
  const normalized = stableStringify(value).toLowerCase();
  return sampleFixtureMarkers.some((marker) => normalized.includes(marker));
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
    const forbiddenKey = isForbiddenActionRequestKey(key);
    if (forbiddenKey && isTruthyActionRequest(entryValue)) {
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
  return /^(true|yes|requested|enabled|allow|allowed|write|update|mutate|apply|create|call|execute|send|run|cleanup)$/i.test(
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
    normalized.includes("blocked")
  ) {
    return false;
  }
  return forbiddenActionKeyPatterns.some((pattern) => pattern.test(key));
}

function isSafePublicRef(value: string): boolean {
  if (value.length < 4 || value.length > 220) return false;
  if (!/^[A-Za-z0-9][A-Za-z0-9:_./#-]*$/.test(value)) return false;
  if (value.includes("..") || value.includes("//") || value.includes("\0")) {
    return false;
  }
  const normalized = value.toLowerCase();
  return !privateRefMarkers.some((marker) => normalized.includes(marker));
}

function asNonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
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
