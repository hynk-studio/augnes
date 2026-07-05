import { createHash } from "node:crypto";

import {
  containsCandidateIngressUnsafeMarkerV01,
  isCandidateIngressPublicSafeRefV01,
  uniqueCandidateIngressStringsV01,
} from "@/lib/intake/candidate-ingress-normalizer";
import {
  CONTINUITY_RELAY_SCOPED_WRITE_PREVIEW_VERSION,
  type ContinuityRelayBucket,
  type ContinuityRelayDirective,
  type ContinuityRelayEntry,
} from "@/types/continuity-relay-scoped-write-preview";
import {
  CONTINUITY_RELAY_RECEIPT_VERSION,
  CONTINUITY_RELAY_RECORD_VERSION,
  CONTINUITY_RELAY_SCOPE,
  CONTINUITY_RELAY_STORE_VERSION,
  type ContinuityRelayNoSideEffects,
  type ContinuityRelayRecord,
  type ContinuityRelayReceipt,
  type ContinuityRelayStoreResult,
  type ContinuityRelayWriteAuthorityBoundary,
  type ContinuityRelayWriteInput,
  type ContinuityRelayWriteStatus,
} from "@/types/continuity-relay-write";

export const CONTINUITY_RELAY_WRITE_TABLE =
  "continuity_relay_records" as const;

export interface ContinuityRelayWriteDbLike {
  exec(sql: string): unknown;
  prepare(sql: string): {
    run(...params: unknown[]): unknown;
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  };
}

export interface ContinuityRelayWriteListOptions {
  idempotency_key?: string;
  operator_ref?: string;
  limit?: number;
}

interface ContinuityRelayWriteRow {
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
  input: ContinuityRelayWriteInput | null;
  idempotency_key: string | null;
}

const allowedRequestedSideEffectKeys = new Set([
  "can_write_db",
  "can_create_continuity_relay_record",
  "can_create_continuity_relay_receipt",
  "can_write_continuity_relay",
  "continuity_relay_record_written",
  "continuity_relay_receipt_written",
  "continuity_relay_persisted",
  "continuity_relay_written",
]);

const forbiddenRequestedSideEffectPatterns = [
  /perspective.*unit/i,
  /current.*working.*perspective|\bcwp\b/i,
  /continuity.*relay/i,
  /handoff/i,
  /memory/i,
  /global.*metric|dogfood.*metrics|update.*metrics/i,
  /metric.*snapshot/i,
  /reuse.*outcome|handoff.*reuse|reuse.*ledger/i,
  /expected.*observed.*delta/i,
  /work.*episode/i,
  /provider|openai/i,
  /github/i,
  /execute.*codex|codex.*execute|codex_executed/i,
  /\bpr\b.*create|\bpr\b.*merge/i,
  /autonomous/i,
  /graph|vector|\brag\b|crawler|browser/i,
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

const directiveByBucket: Record<
  ContinuityRelayBucket,
  ContinuityRelayDirective
> = {
  continuity_relay_preserve_anchor_candidates: "preserve_anchor",
  continuity_relay_warn_anchor_candidates: "warn_anchor",
  continuity_relay_stop_if_missing_candidates: "stop_if_missing",
  continuity_relay_next_focus_candidates: "next_focus",
  continuity_relay_update_suggestions: "relay_update_suggestion",
  preserve_anchor_candidates: "preserve_anchor",
  warn_anchor_candidates: "warn_anchor",
  stop_if_missing_candidates: "stop_if_missing",
  next_focus_candidates: "next_focus",
  relay_update_suggestions: "relay_update_suggestion",
};

const validBuckets = new Set(Object.keys(directiveByBucket));
const validDirectives: Set<string> = new Set(Object.values(directiveByBucket));

export const continuityRelayWriteSchemaSqlV01 = `
CREATE TABLE IF NOT EXISTS continuity_relay_records (
  record_id TEXT PRIMARY KEY,
  idempotency_key TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL,
  scope TEXT NOT NULL,
  operator_ref TEXT NOT NULL,
  record_fingerprint TEXT NOT NULL,
  record_json TEXT NOT NULL,
  receipt_json TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_continuity_relay_records_scope_created
  ON continuity_relay_records(scope, created_at, record_id);

CREATE INDEX IF NOT EXISTS idx_continuity_relay_records_operator
  ON continuity_relay_records(scope, operator_ref, created_at, record_id);
`;

export function ensureContinuityRelayWriteSchemaV01(
  db: ContinuityRelayWriteDbLike,
): void {
  db.exec(continuityRelayWriteSchemaSqlV01);
}

export function continuityRelayWriteSchemaExistsV01(
  db: ContinuityRelayWriteDbLike,
): boolean {
  const row = db
    .prepare(
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name = ?`,
    )
    .get(CONTINUITY_RELAY_WRITE_TABLE) as
    | { name?: string }
    | undefined;
  return row?.name === CONTINUITY_RELAY_WRITE_TABLE;
}

export function validateContinuityRelayWriteInputV01(
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
  const scopedWritePreview = getRecord(input, "scoped_write_preview");
  reasons.push(...validateScopedWritePreview(scopedWritePreview));
  const approval = getRecord(input, "operator_approval");
  reasons.push(...validateApproval({ approval, scopedWritePreview }));
  const material = getRecord(
    scopedWritePreview,
    "would_write_continuity_relay_record_preview",
  );
  if (
    idempotencyKey &&
    typeof material?.requested_idempotency_key === "string" &&
    material.requested_idempotency_key !== idempotencyKey
  ) {
    reasons.push("idempotency_key_mismatch_with_scoped_write_preview");
  }
  if (containsRawOrPrivateMarkers(input)) {
    reasons.push("raw_or_private_marker_material_refused");
  }
  if (containsSampleDefaultOrSmokeMaterial(input)) {
    reasons.push("sample_fixture_default_or_workbench_material_refused");
  }
  reasons.push(...findRequestedSideEffectRefusals(input.requested_side_effects));

  return validationResult({
    refusal_reasons: uniqueCandidateIngressStringsV01(reasons),
    input:
      reasons.length === 0
        ? (input as unknown as ContinuityRelayWriteInput)
        : null,
    idempotency_key: idempotencyKey,
  });
}

export function writeContinuityRelayRecordV01(
  input: unknown,
  options: { db: ContinuityRelayWriteDbLike },
): ContinuityRelayStoreResult {
  const validation = validateContinuityRelayWriteInputV01(input);
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

  ensureContinuityRelayWriteSchemaV01(options.db);
  const record = buildContinuityRelayRecord(
    validation as ValidationResult & {
      ok: true;
      input: ContinuityRelayWriteInput;
      idempotency_key: string;
    },
  );
  const existing = readContinuityRelayRecordByIdempotencyKeyV01(
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
        `INSERT INTO continuity_relay_records (
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

export function refuseContinuityRelayWriteV01(
  input: unknown,
  extraReasons: string[] = [],
): ContinuityRelayStoreResult {
  const validation = validateContinuityRelayWriteInputV01(input);
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

export function readContinuityRelayRecordByIdV01(
  recordId: string,
  options: { db: ContinuityRelayWriteDbLike },
): ContinuityRelayStoreResult {
  if (!continuityRelayWriteSchemaExistsV01(options.db)) {
    return storeResult(
      "schema_missing",
      null,
      [],
      createRefusedReceipt(["schema_missing"], null),
    );
  }
  const row = options.db
    .prepare(
      `SELECT * FROM continuity_relay_records
       WHERE record_id = ? AND scope = ?`,
    )
    .get(recordId, CONTINUITY_RELAY_SCOPE) as
    | ContinuityRelayWriteRow
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

export function readContinuityRelayRecordByIdempotencyKeyV01(
  idempotencyKey: string,
  options: { db: ContinuityRelayWriteDbLike },
): ContinuityRelayStoreResult {
  if (!continuityRelayWriteSchemaExistsV01(options.db)) {
    return storeResult(
      "schema_missing",
      null,
      [],
      createRefusedReceipt(["schema_missing"], idempotencyKey),
    );
  }
  const row = options.db
    .prepare(
      `SELECT * FROM continuity_relay_records
       WHERE idempotency_key = ? AND scope = ?`,
    )
    .get(idempotencyKey, CONTINUITY_RELAY_SCOPE) as
    | ContinuityRelayWriteRow
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

export function listContinuityRelayRecordsV01(
  options: { db: ContinuityRelayWriteDbLike } & ContinuityRelayWriteListOptions,
): ContinuityRelayStoreResult {
  if (!continuityRelayWriteSchemaExistsV01(options.db)) {
    return storeResult(
      "schema_missing",
      null,
      [],
      createRefusedReceipt(["schema_missing"], options.idempotency_key ?? null),
    );
  }
  const clauses = ["scope = ?"];
  const params: unknown[] = [CONTINUITY_RELAY_SCOPE];
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
      `SELECT * FROM continuity_relay_records
       WHERE ${clauses.join(" AND ")}
       ORDER BY created_at DESC, record_id DESC
       LIMIT ?`,
    )
    .all(...params, limit) as ContinuityRelayWriteRow[];
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

export function createContinuityRelayWriteAuthorityBoundaryV01({
  writeNow,
}: {
  writeNow: boolean;
}): ContinuityRelayWriteAuthorityBoundary {
  return {
    durable_local_continuity_relay: true,
    source_of_truth: false,
    local_project_continuity_relay_only: true,
    can_write_db: writeNow,
    can_create_continuity_relay_record: writeNow,
    can_create_continuity_relay_receipt: writeNow,
    can_write_continuity_relay: writeNow,
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
    can_render_workbench_action_button: false,
    notes: [
      "Authority is limited to one scoped local ContinuityRelay record and receipt.",
      "continuity_relay_written means only the scoped local ContinuityRelay record was persisted.",
      "This writer cannot write PerspectiveUnit or NextWorkBias, mutate CWP, update live continuity relay state, apply handoff, write memory, update metrics, write upstream ledgers, call provider/GitHub/Codex, create/merge PRs, run autonomous actions, or create graph/vector/RAG/crawler/browser/Workbench action state.",
    ],
  };
}

function validateScopedWritePreview(preview: Record<string, unknown> | null): string[] {
  if (!preview) return ["scoped_write_preview_missing"];
  const reasons: string[] = [];
  const previewSourceRefs = Array.isArray(preview.source_refs)
    ? preview.source_refs
    : [];
  if (preview.preview_version !== CONTINUITY_RELAY_SCOPED_WRITE_PREVIEW_VERSION) {
    reasons.push("scoped_write_preview_version_invalid");
  }
  if (preview.scope !== CONTINUITY_RELAY_SCOPE) {
    reasons.push("scoped_write_preview_scope_invalid");
  }
  if (
    previewSourceRefs.some(
      (ref) =>
        typeof ref !== "string" || !isCandidateIngressPublicSafeRefV01(ref),
    )
  ) {
    reasons.push("scoped_write_preview_source_refs_unsafe");
  }
  if (
    preview.scoped_write_preview_status !==
    "ready_for_future_continuity_relay_record_write"
  ) {
    reasons.push("scoped_write_preview_not_ready_for_future_continuity_relay_record_write");
  }
  if (preview.recommended_next_action !== "write_continuity_relay_record") {
    reasons.push("scoped_write_preview_recommended_action_not_write");
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
    reasons.push("scoped_write_preview_write_readiness_invalid");
  }
  const material = getRecord(
    preview,
    "would_write_continuity_relay_record_preview",
  );
  if (!material) {
    reasons.push("would_write_continuity_relay_record_preview_missing");
  } else {
    reasons.push(...validateWouldWriteMaterial(material));
  }
  const authority = getRecord(preview, "authority_boundary");
  const falseOnlyAuthorityFields = [
    "source_of_truth",
    "can_write_db",
    "can_create_continuity_relay_record",
    "can_write_continuity_relay",
    "can_write_perspective_unit",
    "can_write_next_work_bias",
    "can_update_current_working_perspective",
    "can_mutate_current_working_perspective",
    "can_update_continuity_relay",
    "can_mutate_handoff_context",
    "can_apply_handoff_context",
    "can_write_selected_refs_to_live_handoff",
    "can_send_handoff",
    "can_write_memory",
    "can_mutate_memory",
    "can_promote_memory",
    "can_update_global_dogfood_metrics",
    "can_write_dogfood_metrics",
    "can_write_dogfood_metric_snapshot",
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
    "can_render_workbench_action_button",
  ];
  if (
    !authority ||
    authority.read_only !== true ||
    authority.advisory_only !== true ||
    authority.candidate_material_only !== true ||
    authority.derived_read_model !== true ||
    falseOnlyAuthorityFields.some((field) => authority[field] !== false)
  ) {
    reasons.push("scoped_write_preview_authority_boundary_invalid");
  }
  const evidenceSummary = getRecord(preview, "evidence_summary");
  if (
    !evidenceSummary ||
    evidenceSummary.has_missing_evidence === true ||
    evidenceSummary.has_refusal_reasons === true ||
    evidenceSummary.has_unsafe_refs === true ||
    !Array.isArray(evidenceSummary.evidence_refs) ||
    safeStringArray(evidenceSummary.evidence_refs).length === 0
  ) {
    reasons.push("scoped_write_preview_evidence_summary_invalid");
  }
  return uniqueCandidateIngressStringsV01(reasons);
}

function validateWouldWriteMaterial(material: Record<string, unknown>): string[] {
  const reasons: string[] = [];
  const selectedRefs = safeStringArray(
    material.selected_continuity_relay_candidate_refs,
  );
  const selectableRefs = safeStringArray(
    material.selectable_continuity_relay_candidate_refs,
  );
  const entries = Array.isArray(material.continuity_relay_entries)
    ? material.continuity_relay_entries
    : [];
  if (selectedRefs.length === 0) {
    reasons.push("selected_continuity_relay_candidate_refs_missing");
  }
  if (!isSafeRefArray(material.selected_continuity_relay_candidate_refs)) {
    reasons.push("selected_continuity_relay_candidate_refs_unsafe");
  }
  if (!isSafeRefArray(material.selectable_continuity_relay_candidate_refs)) {
    reasons.push("selectable_continuity_relay_candidate_refs_unsafe");
  }
  if (selectedRefs.some((ref) => !selectableRefs.includes(ref))) {
    reasons.push("selected_continuity_relay_refs_not_subset_of_selectable_refs");
  }
  if (safeStringArray(material.selected_perspective_unit_candidate_refs).length > 0) {
    reasons.push("selected_perspective_unit_refs_not_writable_by_continuity_relay_slice");
  }
  if (safeStringArray(material.selected_next_work_bias_candidate_refs).length > 0) {
    reasons.push("selected_next_work_bias_refs_not_writable_by_continuity_relay_slice");
  }
  if (!isSafeRefArray(material.source_refs)) reasons.push("source_refs_unsafe");
  if (!isSafeRefArray(material.evidence_refs)) reasons.push("evidence_refs_unsafe");
  if (!isSafeRefArray(material.source_perspective_relay_update_decision_record_refs)) {
    reasons.push("source_perspective_relay_update_decision_record_refs_unsafe");
  }
  if (!isSafeRefArray(material.related_perspective_unit_record_refs)) {
    reasons.push("related_perspective_unit_record_refs_unsafe");
  }
  if (!isSafeRefArray(material.related_next_work_bias_record_refs)) {
    reasons.push("related_next_work_bias_record_refs_unsafe");
  }
  if (safeStringArray(material.source_refs).length === 0) {
    reasons.push("source_refs_missing");
  }
  if (safeStringArray(material.evidence_refs).length === 0) {
    reasons.push("evidence_refs_missing");
  }
  if (
    typeof material.source_perspective_relay_update_write_contract_preview_ref ===
      "string" &&
    !isCandidateIngressPublicSafeRefV01(
      material.source_perspective_relay_update_write_contract_preview_ref,
    )
  ) {
    reasons.push("source_perspective_relay_update_write_contract_preview_ref_unsafe");
  }
  const entryRefs = new Set<string>();
  for (const entry of entries) {
    if (!isRecord(entry)) {
      reasons.push("continuity_relay_entry_malformed");
      continue;
    }
    reasons.push(...validateContinuityRelayEntry(entry, selectedRefs));
    if (typeof entry.source_candidate_ref === "string") {
      entryRefs.add(entry.source_candidate_ref);
    }
  }
  if (entries.length === 0) reasons.push("continuity_relay_entries_missing");
  if (selectedRefs.some((ref) => !entryRefs.has(ref))) {
    reasons.push("selected_continuity_relay_entry_missing");
  }
  return uniqueCandidateIngressStringsV01(reasons);
}

function validateContinuityRelayEntry(
  entry: Record<string, unknown>,
  selectedRefs: string[],
): string[] {
  const reasons: string[] = [];
  if (
    typeof entry.continuity_relay_ref !== "string" ||
    !isCandidateIngressPublicSafeRefV01(entry.continuity_relay_ref)
  ) {
    reasons.push("continuity_relay_entry_ref_unsafe");
  }
  if (
    typeof entry.source_candidate_ref !== "string" ||
    !selectedRefs.includes(entry.source_candidate_ref) ||
    !isCandidateIngressPublicSafeRefV01(entry.source_candidate_ref)
  ) {
    reasons.push("continuity_relay_entry_source_candidate_ref_invalid");
  }
  if (typeof entry.bucket !== "string" || !validBuckets.has(entry.bucket)) {
    reasons.push("continuity_relay_entry_bucket_invalid");
  }
  if (
    typeof entry.relay_directive !== "string" ||
    !validDirectives.has(entry.relay_directive)
  ) {
    reasons.push("continuity_relay_entry_relay_directive_invalid");
  }
  if (
    typeof entry.bucket === "string" &&
    typeof entry.relay_directive === "string" &&
    directiveByBucket[entry.bucket as ContinuityRelayBucket] !==
      entry.relay_directive
  ) {
    reasons.push("continuity_relay_entry_relay_directive_bucket_mismatch");
  }
  if (
    typeof entry.summary !== "string" ||
    !entry.summary.trim() ||
    containsCandidateIngressUnsafeMarkerV01(entry.summary)
  ) {
    reasons.push("continuity_relay_entry_summary_unsafe");
  }
  if (!isSafeRefArray(entry.evidence_refs)) {
    reasons.push("continuity_relay_entry_evidence_refs_unsafe");
  }
  if (!isSafeRefArray(entry.source_refs)) {
    reasons.push("continuity_relay_entry_source_refs_unsafe");
  }
  if (
    !["low", "medium", "high"].includes(
      typeof entry.review_pressure === "string" ? entry.review_pressure : "",
    )
  ) {
    reasons.push("continuity_relay_entry_review_pressure_invalid");
  }
  if (
    ![
      "active_scoped_continuity_relay_anchor",
      "scoped_continuity_relay_warning",
      "scoped_continuity_relay_stop_condition",
      "scoped_continuity_relay_next_focus",
      "scoped_continuity_relay_update_suggestion",
    ].includes(typeof entry.status === "string" ? entry.status : "")
  ) {
    reasons.push("continuity_relay_entry_status_invalid");
  }
  if (entry.persistence_horizon !== "local_project_continuity_relay_record") {
    reasons.push("continuity_relay_entry_persistence_horizon_invalid");
  }
  return reasons;
}

function validateApproval({
  approval,
  scopedWritePreview,
}: {
  approval: Record<string, unknown> | null;
  scopedWritePreview: Record<string, unknown> | null;
}): string[] {
  if (!approval) return ["operator_approval_missing"];
  const reasons: string[] = [];
  if (
    approval.operator_decision !==
    "approve_for_continuity_relay_record"
  ) {
    reasons.push("operator_approval_decision_invalid");
  }
  if (!safeRef(approval.approved_by)) reasons.push("approved_by_missing_or_invalid");
  if (!safeRef(approval.operator_ref)) reasons.push("operator_ref_missing_or_invalid");
  if (!safeRef(approval.approved_at)) reasons.push("approved_at_missing_or_invalid");
  if (
    typeof approval.approval_statement !== "string" ||
    !approval.approval_statement.trim() ||
    containsCandidateIngressUnsafeMarkerV01(approval.approval_statement)
  ) {
    reasons.push("approval_statement_missing_or_unsafe");
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
    scopedWritePreview,
    "would_write_continuity_relay_record_preview",
  );
  if (
    material?.requested_operator_ref &&
    approval.operator_ref !== material.requested_operator_ref
  ) {
    reasons.push("operator_ref_mismatch_with_scoped_write_preview");
  }
  return uniqueCandidateIngressStringsV01(reasons);
}

function buildContinuityRelayRecord(
  validation: ValidationResult & {
    ok: true;
    input: ContinuityRelayWriteInput;
    idempotency_key: string;
  },
): ContinuityRelayRecord {
  const material =
    validation.input.scoped_write_preview
      .would_write_continuity_relay_record_preview;
  const createdAt = validation.input.operator_approval.approved_at;
  const baseRecord = {
    record_version: CONTINUITY_RELAY_RECORD_VERSION,
    idempotency_key: validation.idempotency_key,
    created_at: createdAt,
    scope: CONTINUITY_RELAY_SCOPE,
    operator_ref: validation.input.operator_approval.operator_ref,
    source_refs: material.source_refs,
    evidence_refs: material.evidence_refs,
    source_perspective_relay_update_write_contract_preview_ref:
      material.source_perspective_relay_update_write_contract_preview_ref,
    source_perspective_relay_update_decision_record_refs:
      material.source_perspective_relay_update_decision_record_refs,
    related_perspective_unit_record_refs:
      material.related_perspective_unit_record_refs,
    related_next_work_bias_record_refs:
      material.related_next_work_bias_record_refs,
    selected_continuity_relay_candidate_refs:
      material.selected_continuity_relay_candidate_refs,
    continuity_relay_entries: material.continuity_relay_entries,
    continuity_relay_entry_count: material.continuity_relay_entries.length,
    authority_profile: {
      durable_local_continuity_relay: true,
      source_of_truth: false,
      local_project_continuity_relay_only: true,
      persistence_horizon: "local_project_continuity_relay_record",
      continuity_relay_write_performed: true,
      perspective_unit_write_performed: false,
      next_work_bias_write_performed: false,
      current_working_perspective_update_performed: false,
      continuity_relay_update_performed: false,
      handoff_context_mutation_performed: false,
      memory_promotion_performed: false,
      metric_update_performed: false,
    },
    review_status: "recorded_as_scoped_continuity_relay",
    persistence_horizon: "local_project_continuity_relay_record",
    no_promotion_performed: {
      perspective_unit_written: false,
      next_work_bias_written: false,
      current_working_perspective_updated: false,
      current_working_perspective_mutated: false,
      continuity_relay_updated: false,
      handoff_context_mutated: false,
      handoff_context_applied: false,
      selected_refs_written_to_live_handoff: false,
      handoff_sent: false,
      memory_written: false,
      memory_promoted: false,
      dogfood_metrics_written: false,
      dogfood_metrics_global_state_updated: false,
      dogfood_metric_snapshot_written: false,
      reuse_outcome_ledger_written: false,
      expected_observed_delta_written: false,
      work_episode_written: false,
    },
    write_validation: {
      validation_version: "continuity_relay_write_validation.v0.1",
      scoped_write_preview_revalidated: true,
      selected_continuity_relay_refs_revalidated: true,
      continuity_relay_entries_revalidated: true,
      refused_sample_fixture_default_or_smoke_material: false,
      refused_unrequested_side_effects: false,
      refused_memory_perspective_relay_handoff_promotion: false,
      refused_metric_or_upstream_write: false,
      validation_hash: hashJson({
        idempotency_key: validation.idempotency_key,
        selected_continuity_relay_candidate_refs:
          material.selected_continuity_relay_candidate_refs,
        continuity_relay_entries: material.continuity_relay_entries,
        related_perspective_unit_record_refs:
          material.related_perspective_unit_record_refs,
        related_next_work_bias_record_refs:
          material.related_next_work_bias_record_refs,
        source_refs: material.source_refs,
        evidence_refs: material.evidence_refs,
      }),
    },
    authority_boundary: createContinuityRelayWriteAuthorityBoundaryV01({
      writeNow: true,
    }),
    notes: validation.input.notes ?? [],
  } satisfies Omit<ContinuityRelayRecord, "record_id" | "record_fingerprint">;
  const fingerprint = hashJson(baseRecord);
  return {
    ...baseRecord,
    record_id: `continuity-relay:${fingerprint.slice(0, 24)}`,
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
  record: ContinuityRelayRecord | null;
}): ContinuityRelayReceipt {
  return {
    receipt_version: CONTINUITY_RELAY_RECEIPT_VERSION,
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
      ? `${CONTINUITY_RELAY_WRITE_TABLE}:${record.record_id}`
      : null,
    source_refs: record?.source_refs ?? [],
    no_side_effects: noSideEffects({
      recordWritten: wrote,
      receiptWritten: wrote,
      persisted: wrote,
      continuityRelayWritten: wrote,
    }),
  };
}

function createRefusedReceipt(
  refusalReasons: string[],
  idempotencyKey: string | null,
): ContinuityRelayReceipt {
  return {
    receipt_version: CONTINUITY_RELAY_RECEIPT_VERSION,
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
      continuityRelayWritten: false,
    }),
  };
}

function storeResult(
  status: ContinuityRelayWriteStatus,
  record: ContinuityRelayRecord | null,
  records: ContinuityRelayRecord[],
  receipt: ContinuityRelayReceipt,
): ContinuityRelayStoreResult {
  return {
    store_version: CONTINUITY_RELAY_STORE_VERSION,
    scope: CONTINUITY_RELAY_SCOPE,
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
  continuityRelayWritten,
}: {
  recordWritten: boolean;
  receiptWritten: boolean;
  persisted: boolean;
  continuityRelayWritten: boolean;
}): ContinuityRelayNoSideEffects {
  return {
    continuity_relay_record_written: recordWritten,
    continuity_relay_receipt_written: receiptWritten,
    continuity_relay_persisted: persisted,
    continuity_relay_written: continuityRelayWritten,
    perspective_unit_written: false,
    next_work_bias_written: false,
    current_working_perspective_updated: false,
    current_working_perspective_mutated: false,
    continuity_relay_updated: false,
    handoff_context_mutated: false,
    handoff_context_applied: false,
    selected_refs_written_to_live_handoff: false,
    handoff_sent: false,
    memory_written: false,
    memory_promoted: false,
    memory_mutated: false,
    dogfood_metrics_written: false,
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
    browser_observed: false,
    crawler_or_browser_observer_created: false,
    workbench_action_button_rendered: false,
  };
}

function rowToRecord(
  row: ContinuityRelayWriteRow,
): ContinuityRelayRecord {
  return JSON.parse(row.record_json) as ContinuityRelayRecord;
}

function rowToReceipt(
  row: ContinuityRelayWriteRow,
): ContinuityRelayReceipt {
  return JSON.parse(row.receipt_json) as ContinuityRelayReceipt;
}

function validationResult({
  refusal_reasons,
  input,
  idempotency_key,
}: {
  refusal_reasons: string[];
  input: ContinuityRelayWriteInput | null;
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
      !allowedRequestedSideEffectKeys.has(key) &&
      forbiddenRequestedSideEffectPatterns.some((pattern) => pattern.test(key)) &&
      sideEffectValue === true
    ) {
      reasons.push("requested_side_effect_not_allowed");
    }
  }
  return uniqueCandidateIngressStringsV01(reasons);
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
