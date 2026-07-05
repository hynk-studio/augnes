import { createHash } from "node:crypto";

import {
  containsCandidateIngressUnsafeMarkerV01,
  isCandidateIngressPublicSafeRefV01,
  uniqueCandidateIngressStringsV01,
} from "@/lib/intake/candidate-ingress-normalizer";
import { NEXT_WORK_SIGNAL_OPERATOR_DECISION_PREVIEW_VERSION } from "@/types/next-work-signal-decision";
import {
  NEXT_WORK_SIGNAL_DECISION_RECEIPT_VERSION,
  NEXT_WORK_SIGNAL_DECISION_RECORD_VERSION,
  NEXT_WORK_SIGNAL_DECISION_SCOPE,
  NEXT_WORK_SIGNAL_DECISION_STORE_VERSION,
  type NextWorkSignalDecisionNoSideEffects,
  type NextWorkSignalDecisionRecord,
  type NextWorkSignalDecisionReceipt,
  type NextWorkSignalDecisionStoreResult,
  type NextWorkSignalDecisionWriteAuthorityBoundary,
  type NextWorkSignalDecisionWriteInput,
  type NextWorkSignalDecisionWriteStatus,
} from "@/types/next-work-signal-decision-write";

export const NEXT_WORK_SIGNAL_DECISION_WRITE_TABLE =
  "next_work_signal_decision_records" as const;

export interface NextWorkSignalDecisionWriteDbLike {
  exec(sql: string): unknown;
  prepare(sql: string): {
    run(...params: unknown[]): unknown;
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  };
}

export interface NextWorkSignalDecisionWriteListOptions {
  idempotency_key?: string;
  operator_ref?: string;
  limit?: number;
}

interface NextWorkSignalDecisionWriteRow {
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
  input: NextWorkSignalDecisionWriteInput | null;
  idempotency_key: string | null;
}

const allowedRequestedSideEffectKeys = new Set([
  "can_write_db",
  "can_create_next_work_signal_decision_record",
  "can_create_next_work_signal_decision_receipt",
  "can_write_next_work_signal_decision",
  "next_work_signal_decision_record_written",
  "next_work_signal_decision_receipt_written",
  "next_work_signal_decision_persisted",
]);

const forbiddenRequestedSideEffectPatterns = [
  /perspective.*unit/i,
  /next.*work.*bias/i,
  /current.*working.*perspective|\bcwp\b/i,
  /continuity.*relay/i,
  /handoff/i,
  /memory/i,
  /global.*metric|dogfood.*metrics.*global|update.*metrics/i,
  /metric.*snapshot/i,
  /reuse.*outcome|handoff.*reuse|reuse.*ledger/i,
  /expected.*observed.*delta/i,
  /work.*episode/i,
  /provider|openai/i,
  /github/i,
  /execute.*codex|codex.*execute|codex_executed/i,
  /\bpr\b.*create|\bpr\b.*merge/i,
  /autonomous/i,
  /graph|vector|\brag\b|crawler|browser.*observer/i,
] as const;

const sampleDefaultOrSmokeMarkers = [
  "sample",
  "fixture",
  "smoke_fixture",
  "smoke-fixture",
  "fixture:smoke",
  "smoke:fixture",
  "smoke fixture",
  "workbench:default",
  "default_workbench",
  "default-workbench",
  "workbench:",
] as const;

const signalBuckets = new Set([
  "preserve_context_refs",
  "warn_context_refs",
  "drop_or_deprioritize_context_refs",
  "verification_focus_candidates",
  "expected_observed_followup_candidates",
  "handoff_quality_focus_candidates",
  "context_diet_candidates",
  "review_burden_reduction_candidates",
]);

export const nextWorkSignalDecisionWriteSchemaSqlV01 = `
CREATE TABLE IF NOT EXISTS next_work_signal_decision_records (
  record_id TEXT PRIMARY KEY,
  idempotency_key TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL,
  scope TEXT NOT NULL,
  operator_ref TEXT NOT NULL,
  record_fingerprint TEXT NOT NULL,
  record_json TEXT NOT NULL,
  receipt_json TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_next_work_signal_decision_records_scope_created
  ON next_work_signal_decision_records(scope, created_at, record_id);

CREATE INDEX IF NOT EXISTS idx_next_work_signal_decision_records_operator
  ON next_work_signal_decision_records(scope, operator_ref, created_at, record_id);
`;

export function ensureNextWorkSignalDecisionWriteSchemaV01(
  db: NextWorkSignalDecisionWriteDbLike,
): void {
  db.exec(nextWorkSignalDecisionWriteSchemaSqlV01);
}

export function nextWorkSignalDecisionWriteSchemaExistsV01(
  db: NextWorkSignalDecisionWriteDbLike,
): boolean {
  const row = db
    .prepare(
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name = ?`,
    )
    .get(NEXT_WORK_SIGNAL_DECISION_WRITE_TABLE) as
    | { name?: string }
    | undefined;
  return row?.name === NEXT_WORK_SIGNAL_DECISION_WRITE_TABLE;
}

export function validateNextWorkSignalDecisionWriteInputV01(
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
  const material = getRecord(
    decisionPreview,
    "would_write_next_work_signal_record_preview",
  );
  if (
    idempotencyKey &&
    typeof material?.requested_idempotency_key === "string" &&
    material.requested_idempotency_key !== idempotencyKey
  ) {
    reasons.push("idempotency_key_mismatch_with_decision_preview");
  }
  if (containsRawOrPrivateMarkers(input)) {
    reasons.push("raw_or_private_marker_material_refused");
  }
  if (containsSampleDefaultOrSmokeMaterial(input)) {
    reasons.push("sample_fixture_default_or_workbench_material_refused");
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
        ? (input as unknown as NextWorkSignalDecisionWriteInput)
        : null,
    idempotency_key: idempotencyKey,
  });
}

export function writeNextWorkSignalDecisionRecordV01(
  input: unknown,
  options: { db: NextWorkSignalDecisionWriteDbLike },
): NextWorkSignalDecisionStoreResult {
  const validation = validateNextWorkSignalDecisionWriteInputV01(input);
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

  ensureNextWorkSignalDecisionWriteSchemaV01(options.db);
  const record = buildNextWorkSignalDecisionRecord(
    validation as ValidationResult & {
      ok: true;
      input: NextWorkSignalDecisionWriteInput;
      idempotency_key: string;
    },
  );
  const existing = readNextWorkSignalDecisionRecordByIdempotencyKeyV01(
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
          idempotency_key: validation.idempotency_key,
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
        `INSERT INTO next_work_signal_decision_records (
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
        validation.input.operator_approval.operator_ref,
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
        // Refusal below covers rollback failure.
      }
    }
    return storeResult(
      "refused",
      null,
      [],
      createReceipt({
        validation: {
          idempotency_key: validation.idempotency_key,
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

export function refuseNextWorkSignalDecisionWriteV01(
  input: unknown,
  extraReasons: string[] = [],
): NextWorkSignalDecisionStoreResult {
  const validation = validateNextWorkSignalDecisionWriteInputV01(input);
  return storeResult(
    "refused",
    null,
    [],
    createReceipt({
      validation: {
        idempotency_key: validation.idempotency_key,
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

export function readNextWorkSignalDecisionRecordByIdV01(
  recordId: string,
  options: { db: NextWorkSignalDecisionWriteDbLike },
): NextWorkSignalDecisionStoreResult {
  if (!nextWorkSignalDecisionWriteSchemaExistsV01(options.db)) {
    return storeResult(
      "schema_missing",
      null,
      [],
      createRefusedReceipt(["schema_missing"], null),
    );
  }
  const row = options.db
    .prepare(
      `SELECT * FROM next_work_signal_decision_records
       WHERE record_id = ? AND scope = ?`,
    )
    .get(recordId, NEXT_WORK_SIGNAL_DECISION_SCOPE) as
    | NextWorkSignalDecisionWriteRow
    | undefined;
  if (!row) {
    return storeResult(
      "not_found",
      null,
      [],
      createRefusedReceipt(["record_not_found"], null),
    );
  }
  return storeResult("read", rowToRecord(row), [rowToRecord(row)], rowToReceipt(row));
}

export function readNextWorkSignalDecisionRecordByIdempotencyKeyV01(
  idempotencyKey: string,
  options: { db: NextWorkSignalDecisionWriteDbLike },
): NextWorkSignalDecisionStoreResult {
  if (!nextWorkSignalDecisionWriteSchemaExistsV01(options.db)) {
    return storeResult(
      "schema_missing",
      null,
      [],
      createRefusedReceipt(["schema_missing"], idempotencyKey),
    );
  }
  const row = options.db
    .prepare(
      `SELECT * FROM next_work_signal_decision_records
       WHERE idempotency_key = ? AND scope = ?`,
    )
    .get(idempotencyKey, NEXT_WORK_SIGNAL_DECISION_SCOPE) as
    | NextWorkSignalDecisionWriteRow
    | undefined;
  if (!row) {
    return storeResult(
      "not_found",
      null,
      [],
      createRefusedReceipt(["record_not_found"], idempotencyKey),
    );
  }
  return storeResult("read", rowToRecord(row), [rowToRecord(row)], rowToReceipt(row));
}

export function listNextWorkSignalDecisionRecordsV01(
  options: { db: NextWorkSignalDecisionWriteDbLike } & NextWorkSignalDecisionWriteListOptions,
): NextWorkSignalDecisionStoreResult {
  if (!nextWorkSignalDecisionWriteSchemaExistsV01(options.db)) {
    return storeResult(
      "schema_missing",
      null,
      [],
      createRefusedReceipt(["schema_missing"], options.idempotency_key ?? null),
    );
  }
  const clauses = ["scope = ?"];
  const params: unknown[] = [NEXT_WORK_SIGNAL_DECISION_SCOPE];
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
      `SELECT * FROM next_work_signal_decision_records
       WHERE ${clauses.join(" AND ")}
       ORDER BY created_at DESC, record_id DESC
       LIMIT ?`,
    )
    .all(...params, limit) as NextWorkSignalDecisionWriteRow[];
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

export function createNextWorkSignalDecisionWriteAuthorityBoundaryV01({
  writeNow,
}: {
  writeNow: boolean;
}): NextWorkSignalDecisionWriteAuthorityBoundary {
  return {
    durable_local_next_work_signal_decision: true,
    source_of_truth: false,
    local_project_next_work_signal_only: true,
    can_write_db: writeNow,
    can_create_next_work_signal_decision_record: writeNow,
    can_create_next_work_signal_decision_receipt: writeNow,
    can_write_next_work_signal_decision: writeNow,
    can_write_perspective_unit: false,
    can_write_next_work_bias: false,
    can_update_current_working_perspective: false,
    can_mutate_current_working_perspective: false,
    can_update_continuity_relay: false,
    can_mutate_handoff_context: false,
    can_apply_handoff_context: false,
    can_write_selected_refs_to_live_handoff: false,
    can_send_handoff: false,
    can_write_memory: false,
    can_mutate_memory: false,
    can_promote_memory: false,
    can_update_global_dogfood_metrics: false,
    can_write_dogfood_metrics: false,
    can_write_dogfood_metric_snapshot: false,
    can_write_reuse_outcome_ledger: false,
    can_write_expected_observed_delta: false,
    can_write_work_episode: false,
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
      "Authority is limited to one local NextWorkSignal decision record and receipt.",
      "This writer cannot update Perspective, NextWorkBias, CWP, relay, handoff, memory, metrics, reuse ledger, ExpectedObservedDelta, WorkEpisode, provider, GitHub, Codex, PR, autonomous, graph, vector, RAG, crawler, or browser observer state.",
    ],
  };
}

function validateDecisionPreview(preview: Record<string, unknown> | null): string[] {
  if (!preview) return ["decision_preview_missing"];
  const reasons: string[] = [];
  const decisionPreviewSourceRefs = Array.isArray(preview.source_refs)
    ? preview.source_refs
    : [];
  if (
    preview.preview_version !== NEXT_WORK_SIGNAL_OPERATOR_DECISION_PREVIEW_VERSION
  ) {
    reasons.push("decision_preview_version_invalid");
  }
  if (preview.scope !== NEXT_WORK_SIGNAL_DECISION_SCOPE) {
    reasons.push("decision_preview_scope_invalid");
  }
  if (
    decisionPreviewSourceRefs.some(
      (ref) =>
        typeof ref !== "string" || !isCandidateIngressPublicSafeRefV01(ref),
    )
  ) {
    reasons.push("decision_preview_source_refs_unsafe");
  }
  if (
    preview.decision_preview_status !==
    "ready_for_future_next_work_signal_record_write"
  ) {
    reasons.push("decision_preview_not_ready_for_future_next_work_signal_record_write");
  }
  if (
    preview.recommended_operator_decision !==
    "approve_for_next_work_signal_record"
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
  const material = getRecord(
    preview,
    "would_write_next_work_signal_record_preview",
  );
  if (!material) {
    reasons.push("would_write_next_work_signal_record_preview_missing");
  } else {
    reasons.push(...validateWouldWriteMaterial(material));
  }
  const authority = getRecord(preview, "authority_boundary");
  const falseOnlyAuthorityFields = [
    "source_of_truth",
    "can_persist_decision",
    "can_write_db",
    "can_create_next_work_signal_record",
    "can_write_perspective_unit",
    "can_write_next_work_bias",
    "can_update_current_working_perspective",
    "can_mutate_current_working_perspective",
    "can_update_continuity_relay",
    "can_mutate_handoff_context",
    "can_apply_handoff_context",
    "can_send_handoff",
    "can_write_memory",
    "can_mutate_memory",
    "can_promote_memory",
    "can_write_dogfood_metrics",
    "can_update_metrics",
    "can_write_reuse_outcome_ledger",
    "can_write_expected_observed_delta",
    "can_write_work_episode",
    "can_call_provider_openai",
    "can_call_github",
    "can_execute_codex",
    "can_create_pr",
    "can_merge_pr",
    "can_run_autonomous_action",
    "can_create_graph_or_vector_store",
    "can_create_rag_stack",
    "can_crawl_or_observe_browser",
  ];
  if (
    !authority ||
    authority.read_only !== true ||
    authority.advisory_only !== true ||
    authority.derived_read_model !== true ||
    falseOnlyAuthorityFields.some((field) => authority[field] !== false)
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

function validateWouldWriteMaterial(material: Record<string, unknown>): string[] {
  const reasons: string[] = [];
  const selectedRefs = safeStringArray(material.selected_signal_refs);
  const selectableRefs = safeStringArray(material.selectable_signal_refs);
  const selectedSummaries = Array.isArray(material.selected_signal_summaries)
    ? material.selected_signal_summaries
    : [];
  if (selectedRefs.length === 0) reasons.push("selected_signal_refs_missing");
  if (!isSafeRefArray(material.selected_signal_refs)) {
    reasons.push("selected_signal_refs_unsafe");
  }
  if (!isSafeRefArray(material.selectable_signal_refs)) {
    reasons.push("selectable_signal_refs_unsafe");
  }
  if (selectedRefs.some((ref) => !selectableRefs.includes(ref))) {
    reasons.push("selected_signal_refs_not_subset_of_selectable_refs");
  }
  if (!isSafeRefArray(material.source_refs)) {
    reasons.push("source_refs_unsafe");
  }
  if (!isSafeRefArray(material.evidence_refs)) {
    reasons.push("evidence_refs_unsafe");
  }
  if (safeStringArray(material.source_refs).length === 0) {
    reasons.push("source_refs_missing");
  }
  if (safeStringArray(material.evidence_refs).length === 0) {
    reasons.push("evidence_refs_missing");
  }
  for (const field of [
    "source_metric_snapshot_record_refs",
    "source_reuse_ledger_record_refs",
    "source_expected_observed_delta_record_refs",
  ]) {
    if (!isSafeRefArray(material[field])) {
      reasons.push(`${field}_unsafe`);
    }
  }
  for (const field of [
    "preserve_context_refs",
    "warn_context_refs",
    "drop_or_deprioritize_context_refs",
    "verification_focus_candidates",
    "expected_observed_followup_candidates",
    "handoff_quality_focus_candidates",
    "context_diet_candidates",
    "review_burden_reduction_candidates",
    "unresolved_gap_candidates",
    "stale_or_misleading_context_warnings",
  ]) {
    if (!isSafeRefArray(material[field])) {
      reasons.push(`${field}_unsafe`);
    }
  }
  for (const item of selectedSummaries) {
    if (!isRecord(item)) {
      reasons.push("selected_signal_summary_malformed");
      continue;
    }
    if (
      typeof item.signal_ref !== "string" ||
      !selectedRefs.includes(item.signal_ref)
    ) {
      reasons.push("selected_signal_summary_not_selected");
    }
    if (typeof item.bucket !== "string" || !signalBuckets.has(item.bucket)) {
      reasons.push("selected_signal_summary_bucket_invalid");
    }
    if (
      typeof item.summary !== "string" ||
      containsCandidateIngressUnsafeMarkerV01(item.summary)
    ) {
      reasons.push("selected_signal_summary_unsafe");
    }
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
  if (approval.operator_decision !== "approve_for_next_work_signal_record") {
    reasons.push("operator_approval_decision_invalid");
  }
  if (!safeRef(approval.approved_by)) reasons.push("approved_by_missing_or_invalid");
  if (!safeRef(approval.operator_ref)) reasons.push("operator_ref_missing_or_invalid");
  if (!safeRef(approval.approved_at)) reasons.push("approved_at_missing_or_invalid");
  if (
    typeof approval.approval_statement !== "string" ||
    !approval.approval_statement.trim()
  ) {
    reasons.push("approval_statement_missing");
  }
  if (!Array.isArray(approval.checklist_confirmations)) {
    reasons.push("checklist_confirmations_missing");
  } else if (
    approval.checklist_confirmations.length === 0 ||
    approval.checklist_confirmations.some((item) => !safeRef(item))
  ) {
    reasons.push("checklist_confirmations_missing");
  }
  const material = getRecord(
    decisionPreview,
    "would_write_next_work_signal_record_preview",
  );
  if (
    material?.requested_operator_ref &&
    approval.operator_ref !== material.requested_operator_ref
  ) {
    reasons.push("operator_ref_mismatch_with_decision_preview");
  }
  return uniqueCandidateIngressStringsV01(reasons);
}

function buildNextWorkSignalDecisionRecord(
  validation: ValidationResult & {
    ok: true;
    input: NextWorkSignalDecisionWriteInput;
    idempotency_key: string;
  },
): NextWorkSignalDecisionRecord {
  const material =
    validation.input.decision_preview.would_write_next_work_signal_record_preview;
  const createdAt = validation.input.operator_approval.approved_at;
  const baseRecord = {
    record_version: NEXT_WORK_SIGNAL_DECISION_RECORD_VERSION,
    idempotency_key: validation.idempotency_key,
    created_at: createdAt,
    scope: NEXT_WORK_SIGNAL_DECISION_SCOPE,
    operator_ref: validation.input.operator_approval.operator_ref,
    source_refs: material.source_refs,
    evidence_refs: material.evidence_refs,
    source_metric_snapshot_record_refs: material.source_metric_snapshot_record_refs,
    source_reuse_ledger_record_refs: material.source_reuse_ledger_record_refs,
    source_expected_observed_delta_record_refs:
      material.source_expected_observed_delta_record_refs,
    source_next_work_signal_refresh_preview_ref:
      material.source_next_work_signal_refresh_preview_ref,
    selected_signal_refs: material.selected_signal_refs,
    preserve_context_refs: material.preserve_context_refs,
    warn_context_refs: material.warn_context_refs,
    drop_or_deprioritize_context_refs:
      material.drop_or_deprioritize_context_refs,
    verification_focus_candidates: material.verification_focus_candidates,
    expected_observed_followup_candidates:
      material.expected_observed_followup_candidates,
    handoff_quality_focus_candidates: material.handoff_quality_focus_candidates,
    context_diet_candidates: material.context_diet_candidates,
    review_burden_reduction_candidates:
      material.review_burden_reduction_candidates,
    unresolved_gap_candidates: material.unresolved_gap_candidates,
    stale_or_misleading_context_warnings:
      material.stale_or_misleading_context_warnings,
    authority_profile: {
      durable_local_next_work_signal_decision: true,
      source_of_truth: false,
      local_project_next_work_signal_only: true,
      persistence_horizon: "local_project_next_work_signal_record",
      perspective_promotion_performed: false,
      relay_update_performed: false,
      memory_promotion_performed: false,
    },
    review_status: "recorded_as_next_work_signal_decision",
    persistence_horizon: "local_project_next_work_signal_record",
    no_promotion_performed: {
      perspective_unit_written: false,
      next_work_bias_written: false,
      current_working_perspective_updated: false,
      continuity_relay_written: false,
      handoff_context_mutated: false,
      selected_refs_written_to_live_handoff: false,
      handoff_sent: false,
      memory_mutated: false,
      dogfood_metrics_global_state_updated: false,
      dogfood_metric_snapshot_written: false,
      reuse_outcome_ledger_written: false,
      expected_observed_delta_written: false,
      work_episode_written: false,
    },
    write_validation: {
      validation_version: "next_work_signal_decision_write_validation.v0.1",
      decision_preview_revalidated: true,
      selected_signal_refs_revalidated: true,
      refused_sample_fixture_default_or_smoke_material: false,
      refused_unrequested_side_effects: false,
      refused_memory_perspective_relay_handoff_promotion: false,
      refused_metric_or_upstream_write: false,
      validation_hash: hashJson({
        idempotency_key: validation.idempotency_key,
        selected_signal_refs: material.selected_signal_refs,
        source_refs: material.source_refs,
        evidence_refs: material.evidence_refs,
      }),
    },
    authority_boundary: createNextWorkSignalDecisionWriteAuthorityBoundaryV01({
      writeNow: true,
    }),
    notes: validation.input.notes ?? [],
  } satisfies Omit<NextWorkSignalDecisionRecord, "record_id" | "record_fingerprint">;
  const fingerprint = hashJson(baseRecord);
  return {
    ...baseRecord,
    record_id: `next-work-signal-decision:${fingerprint.slice(0, 24)}`,
    record_fingerprint: fingerprint,
  };
}

function createReceipt({
  validation,
  wrote,
  refused,
  idempotentReplay,
  record,
}: {
  validation: Pick<ValidationResult, "refusal_reasons" | "idempotency_key">;
  wrote: boolean;
  refused: boolean;
  idempotentReplay: boolean;
  record: NextWorkSignalDecisionRecord | null;
}): NextWorkSignalDecisionReceipt {
  return {
    receipt_version: NEXT_WORK_SIGNAL_DECISION_RECEIPT_VERSION,
    record_id: record?.record_id ?? null,
    idempotency_key: validation.idempotency_key,
    wrote,
    idempotent_replay: idempotentReplay,
    created_at: record?.created_at ?? new Date(0).toISOString(),
    refused,
    refusal_reasons: validation.refusal_reasons,
    validation_hash: record?.write_validation.validation_hash ?? null,
    record_fingerprint: record?.record_fingerprint ?? null,
    store_ref: record
      ? `${NEXT_WORK_SIGNAL_DECISION_WRITE_TABLE}:${record.record_id}`
      : null,
    source_refs: record?.source_refs ?? [],
    no_side_effects: noSideEffects({
      recordWritten: wrote,
      receiptWritten: wrote,
      persisted: wrote,
    }),
  };
}

function createRefusedReceipt(
  refusalReasons: string[],
  idempotencyKey: string | null,
): NextWorkSignalDecisionReceipt {
  return {
    receipt_version: NEXT_WORK_SIGNAL_DECISION_RECEIPT_VERSION,
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
    no_side_effects: noSideEffects({
      recordWritten: false,
      receiptWritten: false,
      persisted: false,
    }),
  };
}

function storeResult(
  status: NextWorkSignalDecisionWriteStatus,
  record: NextWorkSignalDecisionRecord | null,
  records: NextWorkSignalDecisionRecord[],
  receipt: NextWorkSignalDecisionReceipt,
): NextWorkSignalDecisionStoreResult {
  return {
    store_version: NEXT_WORK_SIGNAL_DECISION_STORE_VERSION,
    scope: NEXT_WORK_SIGNAL_DECISION_SCOPE,
    status,
    ok: ["written", "idempotent_existing", "read", "listed"].includes(status),
    record,
    records,
    receipt,
    error_code: ["refused", "not_found", "schema_missing"].includes(status)
      ? status
      : null,
    no_side_effects: receipt.no_side_effects,
  };
}

function noSideEffects({
  recordWritten,
  receiptWritten,
  persisted,
}: {
  recordWritten: boolean;
  receiptWritten: boolean;
  persisted: boolean;
}): NextWorkSignalDecisionNoSideEffects {
  return {
    next_work_signal_decision_record_written: recordWritten,
    next_work_signal_decision_receipt_written: receiptWritten,
    next_work_signal_decision_persisted: persisted,
    perspective_unit_written: false,
    next_work_bias_written: false,
    current_working_perspective_updated: false,
    continuity_relay_written: false,
    handoff_context_mutated: false,
    selected_refs_written_to_live_handoff: false,
    handoff_sent: false,
    memory_mutated: false,
    dogfood_metrics_global_state_updated: false,
    dogfood_metric_snapshot_written: false,
    reuse_outcome_ledger_written: false,
    expected_observed_delta_written: false,
    work_episode_written: false,
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

function rowToRecord(row: NextWorkSignalDecisionWriteRow): NextWorkSignalDecisionRecord {
  return JSON.parse(row.record_json) as NextWorkSignalDecisionRecord;
}

function rowToReceipt(row: NextWorkSignalDecisionWriteRow): NextWorkSignalDecisionReceipt {
  return JSON.parse(row.receipt_json) as NextWorkSignalDecisionReceipt;
}

function validationResult({
  refusal_reasons,
  input,
  idempotency_key,
}: {
  refusal_reasons: string[];
  input: NextWorkSignalDecisionWriteInput | null;
  idempotency_key: string | null;
}): ValidationResult {
  const uniqueReasons = uniqueCandidateIngressStringsV01(refusal_reasons);
  return {
    ok: uniqueReasons.length === 0,
    refusal_reasons: uniqueReasons,
    input,
    idempotency_key,
  };
}

function validateNotes(value: unknown): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return ["notes_must_be_safe_string_array"];
  if (
    value.some(
      (item) => typeof item !== "string" || !isCandidateIngressPublicSafeRefV01(item),
    )
  ) {
    return ["notes_must_be_safe_string_array"];
  }
  return [];
}

function findRequestedSideEffectRefusals(value: unknown): string[] {
  if (value === undefined) return [];
  if (!isRecord(value)) return ["requested_side_effects_must_be_object"];
  const reasons: string[] = [];
  for (const [key, sideEffectValue] of Object.entries(value)) {
    if (!allowedRequestedSideEffectKeys.has(key)) {
      reasons.push("requested_side_effect_not_allowed");
    }
    if (sideEffectValue !== true && sideEffectValue !== false) {
      reasons.push("requested_side_effect_value_invalid");
    }
    if (
      forbiddenRequestedSideEffectPatterns.some((pattern) => pattern.test(key)) &&
      sideEffectValue === true
    ) {
      reasons.push("requested_side_effect_not_allowed");
    }
  }
  return uniqueCandidateIngressStringsV01(reasons);
}

function findForbiddenActionRequests(value: unknown): string[] {
  const text = JSON.stringify(value ?? {});
  return forbiddenRequestedSideEffectPatterns.some((pattern) => pattern.test(text))
    ? ["forbidden_side_effect_request_refused"]
    : [];
}

function containsRawOrPrivateMarkers(value: unknown): boolean {
  return (
    containsCandidateIngressUnsafeMarkerV01(JSON.stringify(value)) ||
    containsRawMaterialKey(value, new Set())
  );
}

function containsRawMaterialKey(value: unknown, seen: Set<unknown>): boolean {
  if (!value || typeof value !== "object") return false;
  if (seen.has(value)) return false;
  seen.add(value);
  if (Array.isArray(value)) {
    return value.some((item) => containsRawMaterialKey(item, seen));
  }
  for (const [key, nestedValue] of Object.entries(value)) {
    if (/^(raw_text|raw_report|raw_excerpt)$/i.test(key)) return true;
    if (containsRawMaterialKey(nestedValue, seen)) return true;
  }
  return false;
}

function containsSampleDefaultOrSmokeMaterial(value: unknown): boolean {
  const strings: string[] = [];
  collectStringValues(value, strings, new Set());
  return strings.some((text) =>
    sampleDefaultOrSmokeMarkers.some((marker) =>
      text.toLowerCase().includes(marker),
    ),
  );
}

function collectStringValues(
  item: unknown,
  output: string[],
  seen: Set<unknown>,
): void {
  if (typeof item === "string") {
    output.push(item);
    return;
  }
  if (!item || typeof item !== "object") return;
  if (seen.has(item)) return;
  seen.add(item);
  if (Array.isArray(item)) {
    for (const value of item) collectStringValues(value, output, seen);
    return;
  }
  for (const value of Object.values(item)) collectStringValues(value, output, seen);
}

function safeRef(value: unknown): string | null {
  return isCandidateIngressPublicSafeRefV01(value) ? value : null;
}

function safeStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function isSafeRefArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === "string" && isCandidateIngressPublicSafeRefV01(item),
    )
  );
}

function getRecord(
  value: unknown,
  key: string,
): Record<string, unknown> | null {
  if (!isRecord(value)) return null;
  const nested = value[key];
  return isRecord(nested) ? nested : null;
}

function arrayLength(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function hashJson(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
