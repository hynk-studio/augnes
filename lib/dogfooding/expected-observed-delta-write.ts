import { createHash } from "node:crypto";

import {
  containsCandidateIngressUnsafeMarkerV01,
  isCandidateIngressPublicSafeRefV01,
  uniqueCandidateIngressStringsV01,
} from "@/lib/intake/candidate-ingress-normalizer";
import { EXPECTED_OBSERVED_DELTA_OPERATOR_DECISION_PREVIEW_VERSION } from "@/types/expected-observed-delta-decision";
import {
  EXPECTED_OBSERVED_DELTA_RECEIPT_VERSION,
  EXPECTED_OBSERVED_DELTA_RECORD_VERSION,
  EXPECTED_OBSERVED_DELTA_SCOPE,
  EXPECTED_OBSERVED_DELTA_STORE_VERSION,
  type ExpectedObservedDeltaNoSideEffects,
  type ExpectedObservedDeltaRecord,
  type ExpectedObservedDeltaReceipt,
  type ExpectedObservedDeltaStoreResult,
  type ExpectedObservedDeltaWriteAuthorityBoundary,
  type ExpectedObservedDeltaWriteInput,
  type ExpectedObservedDeltaWriteStatus,
} from "@/types/expected-observed-delta-write";

export const EXPECTED_OBSERVED_DELTA_WRITE_TABLE =
  "expected_observed_delta_records" as const;

export interface ExpectedObservedDeltaWriteDbLike {
  exec(sql: string): unknown;
  prepare(sql: string): {
    run(...params: unknown[]): unknown;
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  };
}

export interface ExpectedObservedDeltaWriteListOptions {
  idempotency_key?: string;
  operator_ref?: string;
  work_ref?: string;
  result_ref?: string;
  handoff_ref?: string;
  limit?: number;
}

interface ExpectedObservedDeltaWriteRow {
  record_id: string;
  idempotency_key: string;
  created_at: string;
  scope: string;
  operator_ref: string;
  work_ref: string | null;
  result_ref: string | null;
  handoff_ref: string | null;
  record_fingerprint: string;
  record_json: string;
  receipt_json: string;
}

interface ValidationResult {
  ok: boolean;
  refusal_reasons: string[];
  input: ExpectedObservedDeltaWriteInput | null;
  idempotency_key: string | null;
}

const allowedRequestedSideEffectKeys = new Set([
  "can_write_db",
  "can_create_expected_observed_delta_record",
  "can_create_expected_observed_delta_receipt",
  "can_write_expected_observed_delta",
]);

const forbiddenRequestedSideEffectPatterns = [
  /reuse.*outcome|handoff.*reuse|reuse.*ledger/i,
  /dogfood.*metric/i,
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

const selectedSummaryBucketMap = {
  matched_expectation_candidates: "matched_expectations",
  missing_expectation_candidates: "missing_expectations",
  unexpected_observation_candidates: "unexpected_observations",
  skipped_or_unverified_check_candidates: "skipped_or_unverified_checks",
  not_done_candidates: "not_done_items",
  changed_file_delta_candidates: "changed_file_deltas",
  requirement_progress_delta_candidates: "requirement_progress_deltas",
  non_goal_risk_candidates: "non_goal_risks",
  followup_delta_candidates: "followups",
  context_reuse_signal_candidates: "context_reuse_signals",
} as const;

export const expectedObservedDeltaWriteSchemaSqlV01 = `
CREATE TABLE IF NOT EXISTS expected_observed_delta_records (
  record_id TEXT PRIMARY KEY,
  idempotency_key TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL,
  scope TEXT NOT NULL,
  operator_ref TEXT NOT NULL,
  work_ref TEXT,
  result_ref TEXT,
  handoff_ref TEXT,
  record_fingerprint TEXT NOT NULL,
  record_json TEXT NOT NULL,
  receipt_json TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_expected_observed_delta_records_scope_created
  ON expected_observed_delta_records(scope, created_at, record_id);

CREATE INDEX IF NOT EXISTS idx_expected_observed_delta_records_operator
  ON expected_observed_delta_records(scope, operator_ref, created_at, record_id);

CREATE INDEX IF NOT EXISTS idx_expected_observed_delta_records_work
  ON expected_observed_delta_records(scope, work_ref, created_at, record_id);

CREATE INDEX IF NOT EXISTS idx_expected_observed_delta_records_result
  ON expected_observed_delta_records(scope, result_ref, created_at, record_id);

CREATE INDEX IF NOT EXISTS idx_expected_observed_delta_records_handoff
  ON expected_observed_delta_records(scope, handoff_ref, created_at, record_id);
`;

export function ensureExpectedObservedDeltaWriteSchemaV01(
  db: ExpectedObservedDeltaWriteDbLike,
): void {
  db.exec(expectedObservedDeltaWriteSchemaSqlV01);
}

export function expectedObservedDeltaWriteSchemaExistsV01(
  db: ExpectedObservedDeltaWriteDbLike,
): boolean {
  const row = db
    .prepare(
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name = ?`,
    )
    .get(EXPECTED_OBSERVED_DELTA_WRITE_TABLE) as { name?: string } | undefined;
  return row?.name === EXPECTED_OBSERVED_DELTA_WRITE_TABLE;
}

export function validateExpectedObservedDeltaWriteInputV01(
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

  const material = getRecord(decisionPreview, "would_write_delta_record_preview");
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
        ? (input as unknown as ExpectedObservedDeltaWriteInput)
        : null,
    idempotency_key: idempotencyKey,
  });
}

export function writeExpectedObservedDeltaRecordV01(
  input: unknown,
  options: { db: ExpectedObservedDeltaWriteDbLike },
): ExpectedObservedDeltaStoreResult {
  const validation = validateExpectedObservedDeltaWriteInputV01(input);
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

  ensureExpectedObservedDeltaWriteSchemaV01(options.db);
  const record = buildExpectedObservedDeltaRecord(
    validation as ValidationResult & {
      ok: true;
      input: ExpectedObservedDeltaWriteInput;
      idempotency_key: string;
    },
  );
  const existing = readExpectedObservedDeltaRecordByIdempotencyKeyV01(
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
        `INSERT INTO expected_observed_delta_records (
          record_id,
          idempotency_key,
          created_at,
          scope,
          operator_ref,
          work_ref,
          result_ref,
          handoff_ref,
          record_fingerprint,
          record_json,
          receipt_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        record.record_id,
        record.idempotency_key,
        record.created_at,
        record.scope,
        validation.input.operator_approval.operator_ref,
        record.work_ref,
        record.result_ref,
        record.handoff_ref,
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

export function refuseExpectedObservedDeltaWriteV01(
  input: unknown,
  extraReasons: string[] = [],
): ExpectedObservedDeltaStoreResult {
  const validation = validateExpectedObservedDeltaWriteInputV01(input);
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

export function readExpectedObservedDeltaRecordByIdV01(
  recordId: string,
  options: { db: ExpectedObservedDeltaWriteDbLike },
): ExpectedObservedDeltaStoreResult {
  if (!isCandidateIngressPublicSafeRefV01(recordId)) {
    return storeResult(
      "refused",
      null,
      [],
      createRefusedReceipt(["record_id_missing_or_invalid"], null),
    );
  }
  if (!expectedObservedDeltaWriteSchemaExistsV01(options.db)) {
    return storeResult(
      "schema_missing",
      null,
      [],
      createRefusedReceipt(["schema_missing"], null),
    );
  }
  const row = options.db
    .prepare(
      `SELECT * FROM expected_observed_delta_records
       WHERE record_id = ? AND scope = ?`,
    )
    .get(recordId, EXPECTED_OBSERVED_DELTA_SCOPE) as
    | ExpectedObservedDeltaWriteRow
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

export function readExpectedObservedDeltaRecordByIdempotencyKeyV01(
  idempotencyKey: string,
  options: { db: ExpectedObservedDeltaWriteDbLike },
): ExpectedObservedDeltaStoreResult {
  if (!isCandidateIngressPublicSafeRefV01(idempotencyKey)) {
    return storeResult(
      "refused",
      null,
      [],
      createRefusedReceipt(["idempotency_key_missing_or_invalid"], idempotencyKey),
    );
  }
  if (!expectedObservedDeltaWriteSchemaExistsV01(options.db)) {
    return storeResult(
      "schema_missing",
      null,
      [],
      createRefusedReceipt(["schema_missing"], idempotencyKey),
    );
  }
  const row = options.db
    .prepare(
      `SELECT * FROM expected_observed_delta_records
       WHERE idempotency_key = ? AND scope = ?`,
    )
    .get(idempotencyKey, EXPECTED_OBSERVED_DELTA_SCOPE) as
    | ExpectedObservedDeltaWriteRow
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

export function listExpectedObservedDeltaRecordsV01(
  options: ExpectedObservedDeltaWriteListOptions & {
    db: ExpectedObservedDeltaWriteDbLike;
  },
): ExpectedObservedDeltaStoreResult {
  if (!expectedObservedDeltaWriteSchemaExistsV01(options.db)) {
    return storeResult(
      "schema_missing",
      null,
      [],
      createRefusedReceipt(["schema_missing"], options.idempotency_key ?? null),
    );
  }
  const clauses = ["scope = ?"];
  const params: unknown[] = [EXPECTED_OBSERVED_DELTA_SCOPE];
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
  if (options.handoff_ref) {
    clauses.push("handoff_ref = ?");
    params.push(options.handoff_ref);
  }
  const limit = Math.max(1, Math.min(options.limit ?? 50, 100));
  const rows = options.db
    .prepare(
      `SELECT * FROM expected_observed_delta_records
       WHERE ${clauses.join(" AND ")}
       ORDER BY created_at DESC, record_id DESC
       LIMIT ?`,
    )
    .all(...params, limit) as ExpectedObservedDeltaWriteRow[];
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

export function createExpectedObservedDeltaWriteAuthorityBoundaryV01({
  writeNow,
}: {
  writeNow: boolean;
}): ExpectedObservedDeltaWriteAuthorityBoundary {
  return {
    durable_local_expected_observed_delta_signal_record: true,
    source_of_truth: false,
    dogfood_signal_record_only: true,
    can_write_db: writeNow,
    can_create_expected_observed_delta_record: writeNow,
    can_create_expected_observed_delta_receipt: writeNow,
    can_write_expected_observed_delta: writeNow,
    can_write_reuse_outcome_ledger: false,
    can_write_dogfood_metrics: false,
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
      "Authority is limited to one local ExpectedObservedDelta record and receipt.",
      "This writer cannot write reuse ledger, dogfood metrics, WorkEpisode, memory, PerspectiveUnit, NextWorkBias, CWP, relay, handoff, provider, GitHub, Codex, PR, autonomous, graph, vector, RAG, crawler, or browser observer state.",
    ],
  };
}

function validateDecisionPreview(preview: Record<string, unknown> | null): string[] {
  if (!preview) return ["decision_preview_missing"];
  const reasons: string[] = [];
  if (
    preview.preview_version !==
    EXPECTED_OBSERVED_DELTA_OPERATOR_DECISION_PREVIEW_VERSION
  ) {
    reasons.push("decision_preview_version_invalid");
  }
  if (preview.scope !== EXPECTED_OBSERVED_DELTA_SCOPE) {
    reasons.push("decision_preview_scope_invalid");
  }
  if (preview.decision_preview_status !== "ready_for_future_delta_record_write") {
    reasons.push("decision_preview_not_ready_for_future_delta_record_write");
  }
  if (
    preview.recommended_operator_decision !==
    "approve_for_expected_observed_delta_record"
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
  const material = getRecord(preview, "would_write_delta_record_preview");
  if (!material) {
    reasons.push("would_write_delta_record_preview_missing");
  } else {
    reasons.push(...validateWouldWriteMaterial(material));
  }
  const authority = getRecord(preview, "authority_boundary");
  if (
    !authority ||
    authority.read_only !== true ||
    authority.advisory_only !== true ||
    authority.source_of_truth !== false ||
    authority.can_write_db !== false ||
    authority.can_create_schema !== false ||
    authority.can_write_expected_observed_delta !== false ||
    authority.can_write_reuse_outcome_ledger !== false ||
    authority.can_write_dogfood_metrics !== false ||
    authority.can_write_work_episode !== false ||
    authority.can_write_memory !== false ||
    authority.can_update_current_working_perspective !== false ||
    authority.can_write_perspective_unit !== false ||
    authority.can_write_next_work_bias !== false ||
    authority.can_update_continuity_relay !== false ||
    authority.can_mutate_handoff_context !== false ||
    authority.can_send_handoff !== false ||
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

function validateWouldWriteMaterial(material: Record<string, unknown>): string[] {
  const reasons: string[] = [];
  const selectedRefsRaw = stringsFromArray(material.selected_delta_candidate_refs);
  const selectableRefsRaw = stringsFromArray(material.selectable_delta_candidate_refs);
  const evidenceRefsRaw = stringsFromArray(material.evidence_refs);
  const sourceRefsRaw = stringsFromArray(material.source_refs);
  const selectedRefs = selectedRefsRaw.filter(isCandidateIngressPublicSafeRefV01);
  const selectableRefs = selectableRefsRaw.filter(isCandidateIngressPublicSafeRefV01);
  const evidenceRefs = evidenceRefsRaw.filter(isCandidateIngressPublicSafeRefV01);
  const sourceRefs = sourceRefsRaw.filter(isCandidateIngressPublicSafeRefV01);

  if (selectedRefsRaw.some((ref) => !isCandidateIngressPublicSafeRefV01(ref))) {
    reasons.push("selected_delta_candidate_refs_unsafe");
  }
  if (selectableRefsRaw.some((ref) => !isCandidateIngressPublicSafeRefV01(ref))) {
    reasons.push("selectable_delta_candidate_refs_unsafe");
  }
  if (evidenceRefsRaw.some((ref) => !isCandidateIngressPublicSafeRefV01(ref))) {
    reasons.push("evidence_refs_unsafe");
  }
  if (sourceRefsRaw.some((ref) => !isCandidateIngressPublicSafeRefV01(ref))) {
    reasons.push("source_refs_unsafe");
  }
  if (selectedRefs.length === 0) reasons.push("selected_delta_candidate_refs_missing");
  for (const ref of selectedRefs) {
    if (!selectableRefs.includes(ref)) {
      reasons.push("selected_delta_candidate_refs_not_subset_of_selectable_refs");
    }
  }
  if (evidenceRefs.length === 0) reasons.push("evidence_refs_missing");
  if (sourceRefs.length === 0) reasons.push("source_refs_missing");
  for (const field of ["work_ref", "result_ref", "handoff_ref"] as const) {
    const value = material[field];
    if (typeof value === "string" && value.trim() && !safeRef(value)) {
      reasons.push(`${field}_unsafe`);
    }
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
    ...validateDeltaCandidateSummaries(
      material.delta_candidate_summaries,
      selectedRefs,
    ),
  );
  const expectedSummary = getRecord(material, "expected_summary");
  const observedSummary = getRecord(material, "observed_summary");
  if (
    countSummaryStrings(expectedSummary) === 0 &&
    countSummaryStrings(observedSummary) === 0
  ) {
    reasons.push("expected_and_observed_summaries_both_empty");
  }
  if (summaryArrayHasSkippedChecks(getArray(observedSummary, "passed_or_completed_checks"))) {
    reasons.push("skipped_checks_counted_as_passed_checks");
  }
  if (summaryArrayHasNotDoneItems(getArray(material, "matched_expectations"))) {
    reasons.push("not_done_items_counted_as_completed_work");
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
  if (approval.operator_decision !== "approve_for_expected_observed_delta_record") {
    reasons.push("operator_decision_invalid");
  }
  for (const field of ["approved_by", "operator_ref", "approved_at", "approval_statement"] as const) {
    if (!safeRef(approval[field])) reasons.push(`${field}_missing_or_invalid`);
  }
  const material = getRecord(decisionPreview, "would_write_delta_record_preview");
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

function validateDeltaCandidateSummaries(
  value: unknown,
  selectedRefs: string[],
): string[] {
  if (!Array.isArray(value)) return ["delta_candidate_summaries_missing_or_invalid"];
  const reasons: string[] = [];
  const selectedRefSet = new Set(selectedRefs);
  const summaryRefs = new Set<string>();
  for (const item of value) {
    if (!isRecord(item)) {
      reasons.push("delta_candidate_summary_malformed");
      continue;
    }
    const candidateRef = item.candidate_ref;
    if (typeof candidateRef !== "string" || !candidateRef.trim()) {
      reasons.push("delta_candidate_summary_malformed");
    } else if (!isCandidateIngressPublicSafeRefV01(candidateRef)) {
      reasons.push("delta_candidate_summary_unsafe");
    } else if (!selectedRefSet.has(candidateRef)) {
      reasons.push("delta_candidate_summary_ref_not_selected");
    } else {
      summaryRefs.add(candidateRef);
    }
    if (item.bucket === "review_only_candidates") {
      reasons.push("review_only_candidate_selected_for_write");
    }
    for (const field of ["bucket", "candidate_kind", "label", "summary"] as const) {
      if (typeof item[field] !== "string" || !safeBoundedText(item[field])) {
        reasons.push("delta_candidate_summary_unsafe_or_empty");
      }
    }
    if (
      typeof item.bucket === "string" &&
      item.bucket === "matched_expectation_candidates" &&
      typeof item.summary === "string" &&
      looksSkippedOrUnverified(item.summary)
    ) {
      reasons.push("skipped_checks_counted_as_passed_checks");
    }
  }
  for (const selectedRef of selectedRefs) {
    if (!summaryRefs.has(selectedRef)) {
      reasons.push("selected_delta_candidate_summary_missing");
    }
  }
  return uniqueCandidateIngressStringsV01(reasons);
}

function buildExpectedObservedDeltaRecord(
  validation: ValidationResult & {
    ok: true;
    input: ExpectedObservedDeltaWriteInput;
    idempotency_key: string;
  },
): ExpectedObservedDeltaRecord {
  const decisionPreview = validation.input.decision_preview;
  const material = decisionPreview.would_write_delta_record_preview;
  const createdAt = validation.input.operator_approval.approved_at;
  const validationHash = createValidationHash({
    decision_preview: decisionPreview,
    operator_approval: validation.input.operator_approval,
    idempotency_key: validation.idempotency_key,
  });
  const recordId = createRecordId(validation.idempotency_key);
  const sourceRefs = uniqueCandidateIngressStringsV01([
    EXPECTED_OBSERVED_DELTA_RECORD_VERSION,
    EXPECTED_OBSERVED_DELTA_STORE_VERSION,
    ...decisionPreview.source_refs,
    ...material.source_refs,
    ...material.evidence_refs,
    ...material.selected_delta_candidate_refs,
  ]).filter(isCandidateIngressPublicSafeRefV01);
  const summariesByBucket = summariesBySelectedBucket(
    material.delta_candidate_summaries,
  );
  const recordWithoutFingerprint: Omit<ExpectedObservedDeltaRecord, "record_fingerprint"> = {
    record_version: EXPECTED_OBSERVED_DELTA_RECORD_VERSION,
    record_id: recordId,
    idempotency_key: validation.idempotency_key,
    created_at: createdAt,
    scope: EXPECTED_OBSERVED_DELTA_SCOPE,
    operator_ref: validation.input.operator_approval.operator_ref,
    source_refs: sourceRefs,
    evidence_refs: uniqueCandidateIngressStringsV01(
      material.evidence_refs,
    ).filter(isCandidateIngressPublicSafeRefV01),
    work_ref: material.work_ref,
    result_ref: material.result_ref,
    handoff_ref: material.handoff_ref,
    codex_result_report_intake_record_refs:
      material.codex_result_report_intake_record_refs,
    work_episode_residue_preview_ref: material.work_episode_residue_preview_ref,
    selected_delta_candidate_refs: material.selected_delta_candidate_refs,
    expected_summary: material.expected_summary,
    observed_summary: material.observed_summary,
    mismatch_summary: material.mismatch_summary,
    matched_expectations: summariesByBucket.matched_expectations,
    missing_expectations: summariesByBucket.missing_expectations,
    unexpected_observations: summariesByBucket.unexpected_observations,
    skipped_or_unverified_checks:
      summariesByBucket.skipped_or_unverified_checks,
    not_done_items: summariesByBucket.not_done_items,
    changed_file_deltas: summariesByBucket.changed_file_deltas,
    requirement_progress_deltas:
      summariesByBucket.requirement_progress_deltas,
    non_goal_risks: summariesByBucket.non_goal_risks,
    followups: summariesByBucket.followups,
    context_reuse_signals: summariesByBucket.context_reuse_signals,
    authority_profile: {
      durable_local_expected_observed_delta_signal_record: true,
      source_of_truth: false,
      dogfood_signal_record_only: true,
      persistence_horizon: "local_project_dogfood_signal_record",
      validation_approval_performed: false,
      reuse_outcome_approval_performed: false,
      memory_promotion_performed: false,
      perspective_promotion_performed: false,
    },
    review_status: "recorded_as_expected_observed_delta",
    persistence_horizon: "local_project_dogfood_signal_record",
    no_promotion_performed: {
      reuse_outcome_ledger_written: false,
      dogfood_metrics_written: false,
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
      validation_version: "expected_observed_delta_write_validation.v0.1",
      decision_preview_revalidated: true,
      selected_delta_candidate_refs_revalidated: true,
      refused_sample_fixture_default_or_smoke_material: false,
      refused_unrequested_side_effects: false,
      refused_memory_perspective_handoff_promotion: false,
      refused_reuse_metric_or_work_episode_write: false,
      validation_hash: validationHash,
    },
    authority_boundary: createExpectedObservedDeltaWriteAuthorityBoundaryV01({
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
  record: ExpectedObservedDeltaRecord | null;
}): ExpectedObservedDeltaReceipt {
  return {
    receipt_version: EXPECTED_OBSERVED_DELTA_RECEIPT_VERSION,
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
    store_ref: record ? `expected_observed_delta_record:${record.record_id}` : null,
    source_refs: record?.source_refs ?? [],
    no_side_effects: createNoSideEffects({
      expectedObservedDeltaWritten: wrote,
    }),
  };
}

function storeResult(
  status: ExpectedObservedDeltaWriteStatus,
  record: ExpectedObservedDeltaRecord | null,
  records: ExpectedObservedDeltaRecord[],
  receipt: ExpectedObservedDeltaReceipt,
): ExpectedObservedDeltaStoreResult {
  return {
    store_version: EXPECTED_OBSERVED_DELTA_STORE_VERSION,
    scope: EXPECTED_OBSERVED_DELTA_SCOPE,
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
  expectedObservedDeltaWritten,
}: {
  expectedObservedDeltaWritten: boolean;
}): ExpectedObservedDeltaNoSideEffects {
  return {
    expected_observed_delta_record_written: expectedObservedDeltaWritten,
    expected_observed_delta_receipt_written: expectedObservedDeltaWritten,
    expected_observed_delta_persisted_as_dogfood_signal_record:
      expectedObservedDeltaWritten,
    reuse_outcome_ledger_written: false,
    dogfood_metrics_written: false,
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
): ExpectedObservedDeltaReceipt {
  return {
    receipt_version: EXPECTED_OBSERVED_DELTA_RECEIPT_VERSION,
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
      expectedObservedDeltaWritten: false,
    }),
  };
}

function rowToRecord(row: ExpectedObservedDeltaWriteRow): ExpectedObservedDeltaRecord {
  return JSON.parse(row.record_json) as ExpectedObservedDeltaRecord;
}

function rowToReceipt(row: ExpectedObservedDeltaWriteRow): ExpectedObservedDeltaReceipt {
  return JSON.parse(row.receipt_json) as ExpectedObservedDeltaReceipt;
}

function summariesBySelectedBucket(
  summaries: ExpectedObservedDeltaWriteInput["decision_preview"]["would_write_delta_record_preview"]["delta_candidate_summaries"],
): Record<
  (typeof selectedSummaryBucketMap)[keyof typeof selectedSummaryBucketMap],
  string[]
> {
  const grouped = {
    matched_expectations: [] as string[],
    missing_expectations: [] as string[],
    unexpected_observations: [] as string[],
    skipped_or_unverified_checks: [] as string[],
    not_done_items: [] as string[],
    changed_file_deltas: [] as string[],
    requirement_progress_deltas: [] as string[],
    non_goal_risks: [] as string[],
    followups: [] as string[],
    context_reuse_signals: [] as string[],
  };
  for (const summary of summaries) {
    const key =
      selectedSummaryBucketMap[
        summary.bucket as keyof typeof selectedSummaryBucketMap
      ];
    if (key) grouped[key].push(summary.summary);
  }
  return grouped;
}

function validationResult({
  refusal_reasons,
  input,
  idempotency_key,
}: {
  refusal_reasons: string[];
  input: ExpectedObservedDeltaWriteInput | null;
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
  const serialized = JSON.stringify(value).toLowerCase();
  return sampleDefaultOrSmokeMarkers.some((marker) =>
    serialized.includes(marker),
  );
}

function createRecordId(idempotencyKey: string): string {
  return `expected_observed_delta:${createHash("sha256")
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

function getArray(record: Record<string, unknown> | null, key: string): string[] {
  if (!record) return [];
  return stringsFromArray(record[key]);
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

function countSummaryStrings(record: Record<string, unknown> | null): number {
  if (!record) return 0;
  return Object.values(record).reduce<number>((sum, value) => {
    if (Array.isArray(value)) {
      return (
        sum +
        value.filter((item) => typeof item === "string" && item.trim()).length
      );
    }
    return sum;
  }, 0);
}

function summaryArrayHasSkippedChecks(values: string[]): boolean {
  return values.some(looksSkippedOrUnverified);
}

function summaryArrayHasNotDoneItems(values: string[]): boolean {
  return values.some((value) =>
    /\b(not done|not_done|todo|remaining|incomplete)\b/i.test(value),
  );
}

function looksSkippedOrUnverified(value: string): boolean {
  return /\b(skip|skipped|not run|not-run|unverified|not verified|not_verified|missing check|did not run)\b/i.test(value);
}
