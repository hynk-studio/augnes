import { createHash } from "node:crypto";

import {
  containsCandidateIngressUnsafeMarkerV01,
  isCandidateIngressPublicSafeRefV01,
  uniqueCandidateIngressStringsV01,
} from "@/lib/intake/candidate-ingress-normalizer";
import { DOGFOOD_METRIC_SNAPSHOT_OPERATOR_DECISION_PREVIEW_VERSION } from "@/types/dogfood-metric-snapshot-decision";
import {
  DOGFOOD_METRIC_SNAPSHOT_RECEIPT_VERSION,
  DOGFOOD_METRIC_SNAPSHOT_RECORD_VERSION,
  DOGFOOD_METRIC_SNAPSHOT_SCOPE,
  DOGFOOD_METRIC_SNAPSHOT_STORE_VERSION,
  type DogfoodMetricSnapshotNoSideEffects,
  type DogfoodMetricSnapshotRecord,
  type DogfoodMetricSnapshotReceipt,
  type DogfoodMetricSnapshotStoreResult,
  type DogfoodMetricSnapshotWriteAuthorityBoundary,
  type DogfoodMetricSnapshotWriteInput,
  type DogfoodMetricSnapshotWriteStatus,
} from "@/types/dogfood-metric-snapshot-write";

export const DOGFOOD_METRIC_SNAPSHOT_WRITE_TABLE =
  "dogfood_metric_snapshot_records" as const;

export interface DogfoodMetricSnapshotWriteDbLike {
  exec(sql: string): unknown;
  prepare(sql: string): {
    run(...params: unknown[]): unknown;
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  };
}

export interface DogfoodMetricSnapshotWriteListOptions {
  idempotency_key?: string;
  operator_ref?: string;
  since?: string;
  until?: string;
  limit?: number;
}

interface DogfoodMetricSnapshotWriteRow {
  record_id: string;
  idempotency_key: string;
  created_at: string;
  scope: string;
  operator_ref: string;
  metric_window_start: string | null;
  metric_window_end: string | null;
  record_fingerprint: string;
  record_json: string;
  receipt_json: string;
}

interface ValidationResult {
  ok: boolean;
  refusal_reasons: string[];
  input: DogfoodMetricSnapshotWriteInput | null;
  idempotency_key: string | null;
}

const allowedRequestedSideEffectKeys = new Set([
  "can_write_db",
  "can_create_dogfood_metric_snapshot_record",
  "can_create_dogfood_metric_snapshot_receipt",
  "can_write_dogfood_metric_snapshot",
  "dogfood_metric_snapshot_record_written",
  "dogfood_metric_snapshot_receipt_written",
  "dogfood_metric_snapshot_persisted",
]);

const forbiddenRequestedSideEffectPatterns = [
  /global.*metric|dogfood.*metrics.*global|update.*metrics/i,
  /reuse.*outcome|handoff.*reuse|reuse.*ledger/i,
  /expected.*observed.*delta/i,
  /work.*episode/i,
  /memory/i,
  /current.*working.*perspective|\bcwp\b/i,
  /perspective.*unit/i,
  /next.*work.*bias/i,
  /continuity.*relay/i,
  /handoff/i,
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

const allowedMetricCandidateBuckets = new Set([
  "helpful_context_signal_count",
  "stale_context_signal_count",
  "missing_context_signal_count",
  "noisy_context_signal_count",
  "misleading_context_signal_count",
  "unknown_context_signal_count",
  "skipped_or_unverified_check_count",
  "not_done_item_count",
  "expected_observed_mismatch_count",
  "requirement_progress_gap_count",
  "carry_forward_candidate_count",
  "review_burden_signal_count",
  "handoff_loss_signal_count",
  "insufficient_data_record_count",
]);

export const dogfoodMetricSnapshotWriteSchemaSqlV01 = `
CREATE TABLE IF NOT EXISTS dogfood_metric_snapshot_records (
  record_id TEXT PRIMARY KEY,
  idempotency_key TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL,
  scope TEXT NOT NULL,
  operator_ref TEXT NOT NULL,
  metric_window_start TEXT,
  metric_window_end TEXT,
  record_fingerprint TEXT NOT NULL,
  record_json TEXT NOT NULL,
  receipt_json TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_dogfood_metric_snapshot_records_scope_created
  ON dogfood_metric_snapshot_records(scope, created_at, record_id);

CREATE INDEX IF NOT EXISTS idx_dogfood_metric_snapshot_records_operator
  ON dogfood_metric_snapshot_records(scope, operator_ref, created_at, record_id);

CREATE INDEX IF NOT EXISTS idx_dogfood_metric_snapshot_records_window
  ON dogfood_metric_snapshot_records(scope, metric_window_start, metric_window_end, created_at);
`;

export function ensureDogfoodMetricSnapshotWriteSchemaV01(
  db: DogfoodMetricSnapshotWriteDbLike,
): void {
  db.exec(dogfoodMetricSnapshotWriteSchemaSqlV01);
}

export function dogfoodMetricSnapshotWriteSchemaExistsV01(
  db: DogfoodMetricSnapshotWriteDbLike,
): boolean {
  const row = db
    .prepare(
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name = ?`,
    )
    .get(DOGFOOD_METRIC_SNAPSHOT_WRITE_TABLE) as { name?: string } | undefined;
  return row?.name === DOGFOOD_METRIC_SNAPSHOT_WRITE_TABLE;
}

export function validateDogfoodMetricSnapshotWriteInputV01(
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
    "would_write_metric_snapshot_record_preview",
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
        ? (input as unknown as DogfoodMetricSnapshotWriteInput)
        : null,
    idempotency_key: idempotencyKey,
  });
}

export function writeDogfoodMetricSnapshotRecordV01(
  input: unknown,
  options: { db: DogfoodMetricSnapshotWriteDbLike },
): DogfoodMetricSnapshotStoreResult {
  const validation = validateDogfoodMetricSnapshotWriteInputV01(input);
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

  ensureDogfoodMetricSnapshotWriteSchemaV01(options.db);
  const record = buildDogfoodMetricSnapshotRecord(
    validation as ValidationResult & {
      ok: true;
      input: DogfoodMetricSnapshotWriteInput;
      idempotency_key: string;
    },
  );
  const existing = readDogfoodMetricSnapshotRecordByIdempotencyKeyV01(
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
        `INSERT INTO dogfood_metric_snapshot_records (
          record_id,
          idempotency_key,
          created_at,
          scope,
          operator_ref,
          metric_window_start,
          metric_window_end,
          record_fingerprint,
          record_json,
          receipt_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        record.record_id,
        record.idempotency_key,
        record.created_at,
        record.scope,
        validation.input.operator_approval.operator_ref,
        record.metric_window.since,
        record.metric_window.until,
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

export function refuseDogfoodMetricSnapshotWriteV01(
  input: unknown,
  extraReasons: string[] = [],
): DogfoodMetricSnapshotStoreResult {
  const validation = validateDogfoodMetricSnapshotWriteInputV01(input);
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

export function readDogfoodMetricSnapshotRecordByIdV01(
  recordId: string,
  options: { db: DogfoodMetricSnapshotWriteDbLike },
): DogfoodMetricSnapshotStoreResult {
  if (!isCandidateIngressPublicSafeRefV01(recordId)) {
    return storeResult(
      "refused",
      null,
      [],
      createRefusedReceipt(["record_id_missing_or_invalid"], null),
    );
  }
  if (!dogfoodMetricSnapshotWriteSchemaExistsV01(options.db)) {
    return storeResult(
      "schema_missing",
      null,
      [],
      createRefusedReceipt(["schema_missing"], null),
    );
  }
  const row = options.db
    .prepare(
      `SELECT * FROM dogfood_metric_snapshot_records
       WHERE record_id = ? AND scope = ?`,
    )
    .get(recordId, DOGFOOD_METRIC_SNAPSHOT_SCOPE) as
    | DogfoodMetricSnapshotWriteRow
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

export function readDogfoodMetricSnapshotRecordByIdempotencyKeyV01(
  idempotencyKey: string,
  options: { db: DogfoodMetricSnapshotWriteDbLike },
): DogfoodMetricSnapshotStoreResult {
  if (!isCandidateIngressPublicSafeRefV01(idempotencyKey)) {
    return storeResult(
      "refused",
      null,
      [],
      createRefusedReceipt(["idempotency_key_missing_or_invalid"], idempotencyKey),
    );
  }
  if (!dogfoodMetricSnapshotWriteSchemaExistsV01(options.db)) {
    return storeResult(
      "schema_missing",
      null,
      [],
      createRefusedReceipt(["schema_missing"], idempotencyKey),
    );
  }
  const row = options.db
    .prepare(
      `SELECT * FROM dogfood_metric_snapshot_records
       WHERE idempotency_key = ? AND scope = ?`,
    )
    .get(idempotencyKey, DOGFOOD_METRIC_SNAPSHOT_SCOPE) as
    | DogfoodMetricSnapshotWriteRow
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

export function listDogfoodMetricSnapshotRecordsV01(
  options: DogfoodMetricSnapshotWriteListOptions & {
    db: DogfoodMetricSnapshotWriteDbLike;
  },
): DogfoodMetricSnapshotStoreResult {
  if (!dogfoodMetricSnapshotWriteSchemaExistsV01(options.db)) {
    return storeResult(
      "schema_missing",
      null,
      [],
      createRefusedReceipt(["schema_missing"], options.idempotency_key ?? null),
    );
  }
  const clauses = ["scope = ?"];
  const params: unknown[] = [DOGFOOD_METRIC_SNAPSHOT_SCOPE];
  if (options.idempotency_key) {
    clauses.push("idempotency_key = ?");
    params.push(options.idempotency_key);
  }
  if (options.operator_ref) {
    clauses.push("operator_ref = ?");
    params.push(options.operator_ref);
  }
  if (options.since) {
    clauses.push("created_at >= ?");
    params.push(options.since);
  }
  if (options.until) {
    clauses.push("created_at <= ?");
    params.push(options.until);
  }
  const limit = Math.max(1, Math.min(options.limit ?? 50, 100));
  const rows = options.db
    .prepare(
      `SELECT * FROM dogfood_metric_snapshot_records
       WHERE ${clauses.join(" AND ")}
       ORDER BY created_at DESC, record_id DESC
       LIMIT ?`,
    )
    .all(...params, limit) as DogfoodMetricSnapshotWriteRow[];
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

export function createDogfoodMetricSnapshotWriteAuthorityBoundaryV01({
  writeNow,
}: {
  writeNow: boolean;
}): DogfoodMetricSnapshotWriteAuthorityBoundary {
  return {
    durable_local_dogfood_metric_snapshot: true,
    source_of_truth: false,
    local_project_metric_snapshot_only: true,
    can_write_db: writeNow,
    can_create_dogfood_metric_snapshot_record: writeNow,
    can_create_dogfood_metric_snapshot_receipt: writeNow,
    can_write_dogfood_metric_snapshot: writeNow,
    can_update_global_dogfood_metrics: false,
    can_write_reuse_outcome_ledger: false,
    can_write_expected_observed_delta: false,
    can_write_work_episode: false,
    can_write_memory: false,
    can_mutate_current_working_perspective: false,
    can_write_perspective_unit: false,
    can_write_next_work_bias: false,
    can_update_continuity_relay: false,
    can_mutate_handoff_context: false,
    can_apply_handoff_context: false,
    can_write_selected_refs_to_live_handoff: false,
    can_send_handoff: false,
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
      "Authority is limited to one local DogfoodMetricSnapshot record and receipt.",
      "This writer cannot update global metrics, reuse ledger, ExpectedObservedDelta, WorkEpisode, memory, PerspectiveUnit, NextWorkBias, CWP, relay, handoff, provider, GitHub, Codex, PR, autonomous, graph, vector, RAG, crawler, or browser observer state.",
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
    preview.preview_version !==
    DOGFOOD_METRIC_SNAPSHOT_OPERATOR_DECISION_PREVIEW_VERSION
  ) {
    reasons.push("decision_preview_version_invalid");
  }
  if (preview.scope !== DOGFOOD_METRIC_SNAPSHOT_SCOPE) {
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
    "ready_for_future_metric_snapshot_write"
  ) {
    reasons.push("decision_preview_not_ready_for_future_metric_snapshot_write");
  }
  if (
    preview.recommended_operator_decision !==
    "approve_for_dogfood_metric_snapshot_write"
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
  const material = getRecord(preview, "would_write_metric_snapshot_record_preview");
  if (!material) {
    reasons.push("would_write_metric_snapshot_record_preview_missing");
  } else {
    reasons.push(...validateWouldWriteMaterial(material));
  }
  const authority = getRecord(preview, "authority_boundary");
  const falseOnlyAuthorityFields = [
    "source_of_truth",
    "can_persist_decision",
    "can_write_db",
    "can_create_schema",
    "can_write_dogfood_metric_snapshot",
    "can_write_dogfood_metrics",
    "can_update_metrics",
    "can_write_reuse_outcome_ledger",
    "can_write_expected_observed_delta",
    "can_write_work_episode",
    "can_write_memory",
    "can_write_perspective_unit",
    "can_write_next_work_bias",
    "can_update_current_working_perspective",
    "can_update_continuity_relay",
    "can_mutate_handoff_context",
    "can_send_handoff",
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
  const selectedRefsRaw = stringsFromArray(material.selected_metric_candidate_refs);
  const selectableRefsRaw = stringsFromArray(material.selectable_metric_candidate_refs);
  const evidenceRefsRaw = stringsFromArray(material.evidence_refs);
  const sourceRefsRaw = stringsFromArray(material.source_refs);
  const reuseLedgerRefsRaw = stringsFromArray(material.source_reuse_ledger_record_refs);
  const expectedObservedRefsRaw = stringsFromArray(
    material.source_expected_observed_delta_record_refs,
  );
  const selectedRefs = selectedRefsRaw.filter(isCandidateIngressPublicSafeRefV01);
  const selectableRefs = selectableRefsRaw.filter(isCandidateIngressPublicSafeRefV01);
  const evidenceRefs = evidenceRefsRaw.filter(isCandidateIngressPublicSafeRefV01);
  const sourceRefs = sourceRefsRaw.filter(isCandidateIngressPublicSafeRefV01);

  if (selectedRefsRaw.some((ref) => !isCandidateIngressPublicSafeRefV01(ref))) {
    reasons.push("selected_metric_candidate_refs_unsafe");
  }
  if (selectableRefsRaw.some((ref) => !isCandidateIngressPublicSafeRefV01(ref))) {
    reasons.push("selectable_metric_candidate_refs_unsafe");
  }
  if (evidenceRefsRaw.some((ref) => !isCandidateIngressPublicSafeRefV01(ref))) {
    reasons.push("evidence_refs_unsafe");
  }
  if (sourceRefsRaw.some((ref) => !isCandidateIngressPublicSafeRefV01(ref))) {
    reasons.push("source_refs_unsafe");
  }
  if (reuseLedgerRefsRaw.some((ref) => !isCandidateIngressPublicSafeRefV01(ref))) {
    reasons.push("source_reuse_ledger_record_refs_unsafe");
  }
  if (
    expectedObservedRefsRaw.some(
      (ref) => !isCandidateIngressPublicSafeRefV01(ref),
    )
  ) {
    reasons.push("source_expected_observed_delta_record_refs_unsafe");
  }
  if (selectedRefs.length === 0) reasons.push("selected_metric_candidate_refs_missing");
  for (const ref of selectedRefs) {
    if (!selectableRefs.includes(ref)) {
      reasons.push("selected_metric_candidate_refs_not_subset_of_selectable_refs");
    }
  }
  if (evidenceRefs.length === 0) reasons.push("evidence_refs_missing");
  if (sourceRefs.length === 0) reasons.push("source_refs_missing");
  if (reuseLedgerRefsRaw.length === 0) {
    reasons.push("source_reuse_ledger_record_refs_missing");
  }
  if (!safeRef(material.review_confirmation_ref)) {
    reasons.push("review_confirmation_ref_missing");
  }
  if (!safeRef(material.requested_operator_ref)) {
    reasons.push("requested_operator_ref_missing");
  }
  if (!safeRef(material.requested_idempotency_key)) {
    reasons.push("requested_idempotency_key_missing");
  }
  reasons.push(
    ...validateMetricCandidateSummaries(
      material.metric_candidate_summaries,
      selectedRefs,
    ),
  );
  const aggregateCounts = getRecord(material, "aggregate_counts");
  const verificationQuality = getRecord(material, "verification_quality_metrics");
  const reuseQuality = getRecord(material, "reuse_quality_metrics");
  if (aggregateCounts && allMetricCountsZero(aggregateCounts)) {
    reasons.push("metric_counts_all_zero");
  }
  if (
    numberValue(verificationQuality?.skipped_or_unverified_check_count) > 0 &&
    numberValue(verificationQuality?.verified_success_count) > 0
  ) {
    reasons.push("skipped_checks_counted_as_success");
  }
  if (
    numberValue(aggregateCounts?.not_done_item_count) > 0 &&
    JSON.stringify(material).toLowerCase().includes("completed_not_done")
  ) {
    reasons.push("not_done_items_counted_as_completion");
  }
  if (
    numberValue(reuseQuality?.helpful_context_signal_count) > 0 &&
    JSON.stringify(getArray(material, "selected_metric_candidate_summaries"))
      .toLowerCase()
      .includes("stale missing misleading helpful")
  ) {
    reasons.push("missing_stale_misleading_context_counted_as_helpful");
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
    approval.operator_decision !==
    "approve_for_dogfood_metric_snapshot_write"
  ) {
    reasons.push("operator_decision_invalid");
  }
  for (const field of ["approved_by", "operator_ref", "approved_at", "approval_statement"] as const) {
    if (!safeRef(approval[field])) reasons.push(`${field}_missing_or_invalid`);
  }
  const material = getRecord(
    decisionPreview,
    "would_write_metric_snapshot_record_preview",
  );
  if (
    typeof material?.requested_operator_ref === "string" &&
    typeof approval.operator_ref === "string" &&
    material.requested_operator_ref !== approval.operator_ref
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

function validateMetricCandidateSummaries(
  value: unknown,
  selectedRefs: string[],
): string[] {
  if (!Array.isArray(value)) return ["metric_candidate_summaries_missing_or_invalid"];
  const reasons: string[] = [];
  const selectedRefSet = new Set(selectedRefs);
  const summaryRefs = new Set<string>();
  for (const item of value) {
    if (!isRecord(item)) {
      reasons.push("metric_candidate_summary_malformed");
      continue;
    }
    const candidateRef = item.candidate_ref;
    if (typeof candidateRef !== "string" || !candidateRef.trim()) {
      reasons.push("metric_candidate_summary_malformed");
    } else if (!isCandidateIngressPublicSafeRefV01(candidateRef)) {
      reasons.push("metric_candidate_summary_unsafe");
    } else if (selectedRefSet.has(candidateRef)) {
      summaryRefs.add(candidateRef);
    }
    if (
      typeof item.bucket !== "string" ||
      !allowedMetricCandidateBuckets.has(item.bucket)
    ) {
      reasons.push("metric_candidate_summary_bucket_invalid");
    }
    for (const field of ["bucket", "candidate_kind", "label", "summary"] as const) {
      if (typeof item[field] !== "string" || !safeBoundedText(item[field])) {
        reasons.push("metric_candidate_summary_unsafe_or_empty");
      }
    }
    if (
      item.bucket === "helpful_context_signal_count" &&
      typeof item.summary === "string" &&
      /\b(stale|missing|misleading)\b/i.test(item.summary)
    ) {
      reasons.push("missing_stale_misleading_context_counted_as_helpful");
    }
    if (
      item.bucket === "skipped_or_unverified_check_count" &&
      typeof item.summary === "string" &&
      /\b(success|passed|complete)\b/i.test(item.summary)
    ) {
      reasons.push("skipped_checks_counted_as_success");
    }
    if (
      item.bucket === "not_done_item_count" &&
      typeof item.summary === "string" &&
      /\b(success|passed|complete)\b/i.test(item.summary)
    ) {
      reasons.push("not_done_items_counted_as_completion");
    }
  }
  for (const selectedRef of selectedRefs) {
    if (!summaryRefs.has(selectedRef)) {
      reasons.push("selected_metric_candidate_summary_missing");
    }
  }
  return uniqueCandidateIngressStringsV01(reasons);
}

function buildDogfoodMetricSnapshotRecord(
  validation: ValidationResult & {
    ok: true;
    input: DogfoodMetricSnapshotWriteInput;
    idempotency_key: string;
  },
): DogfoodMetricSnapshotRecord {
  const decisionPreview = validation.input.decision_preview;
  const material = decisionPreview.would_write_metric_snapshot_record_preview;
  const createdAt = validation.input.operator_approval.approved_at;
  const validationHash = createValidationHash({
    decision_preview: decisionPreview,
    operator_approval: validation.input.operator_approval,
    idempotency_key: validation.idempotency_key,
  });
  const recordId = createRecordId(validation.idempotency_key);
  const sourceRefs = uniqueCandidateIngressStringsV01([
    DOGFOOD_METRIC_SNAPSHOT_RECORD_VERSION,
    DOGFOOD_METRIC_SNAPSHOT_STORE_VERSION,
    ...decisionPreview.source_refs,
    ...material.source_refs,
    ...material.evidence_refs,
    ...material.selected_metric_candidate_refs,
    ...material.source_reuse_ledger_record_refs,
    ...material.source_expected_observed_delta_record_refs,
  ]).filter(isCandidateIngressPublicSafeRefV01);
  const recordWithoutFingerprint: Omit<DogfoodMetricSnapshotRecord, "record_fingerprint"> = {
    record_version: DOGFOOD_METRIC_SNAPSHOT_RECORD_VERSION,
    record_id: recordId,
    idempotency_key: validation.idempotency_key,
    created_at: createdAt,
    scope: DOGFOOD_METRIC_SNAPSHOT_SCOPE,
    operator_ref: validation.input.operator_approval.operator_ref,
    source_refs: sourceRefs,
    evidence_refs: uniqueCandidateIngressStringsV01(
      material.evidence_refs,
    ).filter(isCandidateIngressPublicSafeRefV01),
    source_reuse_ledger_record_refs: material.source_reuse_ledger_record_refs,
    source_expected_observed_delta_record_refs:
      material.source_expected_observed_delta_record_refs,
    metric_window: material.metric_window,
    selected_metric_candidate_refs: material.selected_metric_candidate_refs,
    aggregate_counts: material.aggregate_counts,
    reuse_quality_metrics: material.reuse_quality_metrics,
    handoff_quality_metrics: material.handoff_quality_metrics,
    expected_observed_quality_metrics:
      material.expected_observed_quality_metrics,
    verification_quality_metrics: material.verification_quality_metrics,
    context_diet_metrics: material.context_diet_metrics,
    metric_trend_candidates: material.metric_trend_candidates,
    insufficient_data_notes: material.insufficient_data_notes,
    authority_profile: {
      durable_local_dogfood_metric_snapshot: true,
      source_of_truth: false,
      local_project_metric_snapshot_only: true,
      persistence_horizon: "local_project_dogfood_metric_snapshot",
      global_metric_update_performed: false,
      perspective_promotion_performed: false,
      memory_promotion_performed: false,
    },
    review_status: "recorded_as_dogfood_metric_snapshot",
    persistence_horizon: "local_project_dogfood_metric_snapshot",
    no_promotion_performed: {
      dogfood_metrics_global_state_updated: false,
      reuse_outcome_ledger_written: false,
      expected_observed_delta_written: false,
      work_episode_written: false,
      memory_mutated: false,
      current_working_perspective_updated: false,
      perspective_unit_written: false,
      next_work_bias_written: false,
      continuity_relay_written: false,
      handoff_context_mutated: false,
      selected_refs_written_to_live_handoff: false,
      handoff_sent: false,
    },
    write_validation: {
      validation_version: "dogfood_metric_snapshot_write_validation.v0.1",
      decision_preview_revalidated: true,
      selected_metric_candidate_refs_revalidated: true,
      refused_sample_fixture_default_or_smoke_material: false,
      refused_unrequested_side_effects: false,
      refused_memory_perspective_handoff_promotion: false,
      refused_global_metric_or_upstream_write: false,
      validation_hash: validationHash,
    },
    authority_boundary: createDogfoodMetricSnapshotWriteAuthorityBoundaryV01({
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
  record: DogfoodMetricSnapshotRecord | null;
}): DogfoodMetricSnapshotReceipt {
  return {
    receipt_version: DOGFOOD_METRIC_SNAPSHOT_RECEIPT_VERSION,
    record_id: record?.record_id ?? null,
    idempotency_key: validation.idempotency_key,
    wrote,
    idempotent_replay: idempotentReplay,
    created_at: record?.created_at ?? new Date(0).toISOString(),
    refused,
    refusal_reasons: validation.refusal_reasons,
    validation_hash: validation.ok
      ? createValidationHash({
          decision_preview: validation.input?.decision_preview ?? null,
          operator_approval: validation.input?.operator_approval ?? null,
          idempotency_key: validation.idempotency_key,
        })
      : null,
    record_fingerprint: record?.record_fingerprint ?? null,
    store_ref: record ? `dogfood_metric_snapshot_record:${record.record_id}` : null,
    source_refs: record?.source_refs ?? [],
    no_side_effects: createNoSideEffects({
      dogfoodMetricSnapshotWritten: wrote,
    }),
  };
}

function storeResult(
  status: DogfoodMetricSnapshotWriteStatus,
  record: DogfoodMetricSnapshotRecord | null,
  records: DogfoodMetricSnapshotRecord[],
  receipt: DogfoodMetricSnapshotReceipt,
): DogfoodMetricSnapshotStoreResult {
  return {
    store_version: DOGFOOD_METRIC_SNAPSHOT_STORE_VERSION,
    scope: DOGFOOD_METRIC_SNAPSHOT_SCOPE,
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

function createNoSideEffects({
  dogfoodMetricSnapshotWritten,
}: {
  dogfoodMetricSnapshotWritten: boolean;
}): DogfoodMetricSnapshotNoSideEffects {
  return {
    dogfood_metric_snapshot_record_written: dogfoodMetricSnapshotWritten,
    dogfood_metric_snapshot_receipt_written: dogfoodMetricSnapshotWritten,
    dogfood_metric_snapshot_persisted: dogfoodMetricSnapshotWritten,
    dogfood_metrics_global_state_updated: false,
    reuse_outcome_ledger_written: false,
    expected_observed_delta_written: false,
    work_episode_written: false,
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

function createRefusedReceipt(
  refusalReasons: string[],
  idempotencyKey: string | null,
): DogfoodMetricSnapshotReceipt {
  return {
    receipt_version: DOGFOOD_METRIC_SNAPSHOT_RECEIPT_VERSION,
    record_id: null,
    idempotency_key: idempotencyKey,
    wrote: false,
    idempotent_replay: false,
    created_at: new Date(0).toISOString(),
    refused: true,
    refusal_reasons: refusalReasons,
    validation_hash: null,
    record_fingerprint: null,
    store_ref: null,
    source_refs: [],
    no_side_effects: createNoSideEffects({
      dogfoodMetricSnapshotWritten: false,
    }),
  };
}

function rowToRecord(row: DogfoodMetricSnapshotWriteRow): DogfoodMetricSnapshotRecord {
  return JSON.parse(row.record_json) as DogfoodMetricSnapshotRecord;
}

function rowToReceipt(row: DogfoodMetricSnapshotWriteRow): DogfoodMetricSnapshotReceipt {
  return JSON.parse(row.receipt_json) as DogfoodMetricSnapshotReceipt;
}

function validationResult({
  refusal_reasons,
  input,
  idempotency_key,
}: {
  refusal_reasons: string[];
  input: DogfoodMetricSnapshotWriteInput | null;
  idempotency_key: string | null;
}): ValidationResult {
  const uniqueReasons = uniqueCandidateIngressStringsV01(refusal_reasons);
  return {
    ok: uniqueReasons.length === 0,
    refusal_reasons: uniqueReasons,
    input: uniqueReasons.length === 0 ? input : null,
    idempotency_key,
  };
}

function validateNotes(value: unknown): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return ["notes_must_be_safe_string_array"];
  if (value.length > 20) return ["notes_too_large"];
  const reasons: string[] = [];
  for (const note of value) {
    if (!safeBoundedText(note)) reasons.push("notes_must_be_safe_string_array");
  }
  return uniqueCandidateIngressStringsV01(reasons);
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
      reasons.push("requested_side_effect_value_must_be_boolean");
    }
    if (
      forbiddenRequestedSideEffectPatterns.some((pattern) =>
        pattern.test(`${key}:${String(sideEffectValue)}`),
      )
    ) {
      reasons.push("requested_forbidden_side_effect_refused");
    }
  }
  return uniqueCandidateIngressStringsV01(reasons);
}

function findForbiddenActionRequests(value: unknown): string[] {
  if (value === undefined || value === null) return [];
  const serialized = JSON.stringify(value);
  return forbiddenRequestedSideEffectPatterns.some((pattern) =>
    pattern.test(serialized),
  )
    ? ["forbidden_authority_request_refused"]
    : [];
}

function containsRawOrPrivateMarkers(value: unknown): boolean {
  const seen = new Set<unknown>();
  const visit = (item: unknown): boolean => {
    if (item === null || item === undefined) return false;
    if (typeof item === "string") {
      return (
        containsCandidateIngressUnsafeMarkerV01(item) ||
        /raw_text|raw_report|raw_excerpt|password|private|token|credential/i.test(
          item,
        ) ||
        /[a-z][a-z0-9+.-]*:\/\/[^/\s]+@/i.test(item)
      );
    }
    if (typeof item !== "object") return false;
    if (seen.has(item)) return false;
    seen.add(item);
    if (Array.isArray(item)) return item.some(visit);
    return Object.entries(item).some(
      ([key, nested]) =>
        /raw_text|raw_report|raw_excerpt|password|private|token|credential/i.test(
          key,
        ) || visit(nested),
    );
  };
  return visit(value);
}

function containsSampleDefaultOrSmokeMaterial(value: unknown): boolean {
  const seen = new Set<unknown>();
  const visit = (item: unknown): boolean => {
    if (item === null || item === undefined) return false;
    if (typeof item === "string") {
      const normalized = item.toLowerCase();
      return sampleDefaultOrSmokeMarkers.some((marker) =>
        normalized.includes(marker),
      );
    }
    if (typeof item !== "object") return false;
    if (seen.has(item)) return false;
    seen.add(item);
    if (Array.isArray(item)) return item.some(visit);
    return Object.values(item).some(visit);
  };
  return visit(value);
}

function createRecordId(idempotencyKey: string): string {
  return `dogfood_metric_snapshot:${createHash("sha256")
    .update(idempotencyKey)
    .digest("hex")
    .slice(0, 24)}`;
}

function createValidationHash(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function createRecordFingerprint(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => `${JSON.stringify(key)}:${stableStringify(nested)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function safeRef(value: unknown): string | null {
  return isCandidateIngressPublicSafeRefV01(value) ? value : null;
}

function safeBoundedText(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim() === value &&
    value.length > 0 &&
    value.length <= 240 &&
    !/[\r\n\t\0\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value) &&
    !containsRawOrPrivateMarkers(value)
  );
}

function stringsFromArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function getArray(record: Record<string, unknown> | null, key: string): unknown[] {
  if (!record) return [];
  return Array.isArray(record[key]) ? record[key] : [];
}

function getRecord(value: unknown, key: string): Record<string, unknown> | null {
  if (!isRecord(value)) return null;
  const nested = value[key];
  return isRecord(nested) ? nested : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function arrayLength(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function numberValue(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function allMetricCountsZero(record: Record<string, unknown>): boolean {
  return [
    "helpful_context_signal_count",
    "stale_context_signal_count",
    "missing_context_signal_count",
    "noisy_context_signal_count",
    "misleading_context_signal_count",
    "unknown_context_signal_count",
    "skipped_or_unverified_check_count",
    "not_done_item_count",
    "expected_observed_mismatch_count",
    "requirement_progress_gap_count",
    "carry_forward_candidate_count",
    "review_burden_signal_count",
    "handoff_loss_signal_count",
    "insufficient_data_record_count",
  ].every((field) => numberValue(record[field]) === 0);
}
