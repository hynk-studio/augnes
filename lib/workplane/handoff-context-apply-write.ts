import { createHash } from "node:crypto";

import {
  containsCandidateIngressUnsafeMarkerV01,
  isCandidateIngressPublicSafeRefV01,
  uniqueCandidateIngressStringsV01,
} from "@/lib/intake/candidate-ingress-normalizer";
import {
  HANDOFF_CONTEXT_APPLY_DECISION_PREVIEW_VERSION,
  type HandoffContextApplyOperatorDecisionPreview,
} from "@/types/handoff-context-apply-slice-decision";
import { HANDOFF_CONTEXT_APPLY_PREVIEW_VERSION } from "@/types/handoff-context-apply-slice-preview";
import {
  APPLIED_HANDOFF_CONTEXT_SNAPSHOT_VERSION,
  HANDOFF_CONTEXT_APPLY_RECEIPT_VERSION,
  HANDOFF_CONTEXT_APPLY_RECORD_VERSION,
  HANDOFF_CONTEXT_APPLY_STORE_VERSION,
  HANDOFF_CONTEXT_APPLY_WRITE_SCOPE,
  type AppliedHandoffContextSnapshot,
  type HandoffContextApplyAuthorityProfile,
  type HandoffContextApplyNoHandoffSend,
  type HandoffContextApplyNoSideEffects,
  type HandoffContextApplyRecord,
  type HandoffContextApplyReceipt,
  type HandoffContextApplyStoreResult,
  type HandoffContextApplyWriteAuthorityBoundary,
  type HandoffContextApplyWriteInput,
  type HandoffContextApplyWriteStatus,
  type HandoffContextApplyWriteValidation,
} from "@/types/handoff-context-apply-write";

export const HANDOFF_CONTEXT_APPLY_WRITE_TABLE =
  "handoff_context_apply_records" as const;

export interface HandoffContextApplyWriteDbLike {
  exec(sql: string): unknown;
  prepare(sql: string): {
    run(...params: unknown[]): unknown;
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  };
}

export interface HandoffContextApplyWriteListOptions {
  idempotency_key?: string;
  operator_ref?: string;
  applied_handoff_context_snapshot_ref?: string;
  limit?: number;
}

interface HandoffContextApplyWriteRow {
  record_id: string;
  idempotency_key: string;
  created_at: string;
  scope: string;
  operator_ref: string;
  record_fingerprint: string;
  applied_snapshot_ref: string;
  record_json: string;
  applied_snapshot_json: string;
  receipt_json: string;
}

interface ValidationResult {
  ok: boolean;
  refusal_reasons: string[];
  input: HandoffContextApplyWriteInput | null;
  idempotency_key: string | null;
}

const allowedRequestedSideEffectKeys = new Set([
  "can_write_db",
  "can_create_handoff_context_apply_record",
  "can_create_handoff_context_apply_receipt",
  "can_create_applied_handoff_context_snapshot",
  "can_apply_handoff_context_update_to_local_snapshot",
  "handoff_context_apply_record_written",
  "handoff_context_apply_receipt_written",
  "handoff_context_apply_persisted",
  "applied_handoff_context_snapshot_written",
  "handoff_context_update_applied_to_local_snapshot",
]);

const forbiddenRequestedSideEffectPatterns = [
  /handoff.*(send|copy|export|live|mutate|selected.*refs)/i,
  /selected.*refs.*live.*handoff/i,
  /api.*perspective.*current|route.*(modify|replace|mutate|write)/i,
  /current.*working.*perspective.*(source.*table|upstream|snapshot.*write|apply.*record|update.*contract|route.*integration)/i,
  /perspective.*unit/i,
  /next.*work.*bias/i,
  /continuity.*relay|live.*relay/i,
  /memory/i,
  /global.*metric|dogfood.*metrics|update.*metrics|metric.*snapshot/i,
  /reuse.*outcome|reuse.*ledger/i,
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

const readOnlyAuthorityRequiredFalseFields = [
  "can_write_db",
  "can_create_handoff_context_apply_record",
  "can_create_applied_handoff_context_snapshot",
  "can_apply_handoff_context_update_to_local_snapshot",
  "can_apply_handoff_context_update_live",
  "can_mutate_handoff_context",
  "can_send_handoff",
  "can_copy_export_handoff_packet",
  "can_write_selected_refs_to_live_handoff",
  "can_modify_api_perspective_current_route",
  "can_replace_current_working_perspective_route_response",
  "can_update_upstream_current_working_perspective_source_tables",
  "can_write_applied_current_working_perspective_snapshot",
  "can_write_current_working_perspective_apply_record",
  "can_write_current_working_perspective_update_contract_record",
  "can_write_route_integration_contract_record",
  "can_write_handoff_context_update_contract_record",
  "can_write_perspective_unit",
  "can_write_next_work_bias",
  "can_write_continuity_relay",
  "can_update_continuity_relay",
  "can_apply_live_relay_state",
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
] as const;

const readOnlyAuthorityOptionalFalseFields = [
  "can_create_handoff_context_apply_receipt",
] as const;

export const handoffContextApplyWriteSchemaSqlV01 = `
CREATE TABLE IF NOT EXISTS handoff_context_apply_records (
  record_id TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  scope TEXT NOT NULL,
  operator_ref TEXT NOT NULL,
  record_fingerprint TEXT NOT NULL,
  applied_snapshot_ref TEXT NOT NULL,
  record_json TEXT NOT NULL,
  applied_snapshot_json TEXT NOT NULL,
  receipt_json TEXT NOT NULL,
  UNIQUE(scope, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_handoff_context_apply_records_scope_created
  ON handoff_context_apply_records(scope, created_at, record_id);

CREATE INDEX IF NOT EXISTS idx_handoff_context_apply_records_operator
  ON handoff_context_apply_records(scope, operator_ref, created_at, record_id);

CREATE INDEX IF NOT EXISTS idx_handoff_context_apply_records_snapshot
  ON handoff_context_apply_records(scope, applied_snapshot_ref, created_at, record_id);
`;

export function ensureHandoffContextApplyWriteSchemaV01(
  db: HandoffContextApplyWriteDbLike,
): void {
  db.exec(handoffContextApplyWriteSchemaSqlV01);
}

export function handoffContextApplyWriteSchemaExistsV01(
  db: HandoffContextApplyWriteDbLike,
): boolean {
  const row = db
    .prepare(
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name = ?`,
    )
    .get(HANDOFF_CONTEXT_APPLY_WRITE_TABLE) as { name?: string } | undefined;
  return row?.name === HANDOFF_CONTEXT_APPLY_WRITE_TABLE;
}

export function validateHandoffContextApplyWriteInputV01(
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
  const idempotencyKey = safeRef(input.idempotency_key)
    ? input.idempotency_key
    : null;
  if (!idempotencyKey) reasons.push("idempotency_key_missing_or_invalid");
  reasons.push(...validateNotes(input.notes));
  const decisionPreview = getRecord(input, "apply_decision_preview");
  reasons.push(...validateDecisionPreview(decisionPreview));
  const decisionMaterial = getRecord(
    decisionPreview,
    "would_write_handoff_context_apply_decision_preview",
  );
  const applyPreview = getRecord(decisionMaterial, "contract_preview");
  const recordMaterial = getRecord(
    applyPreview,
    "would_write_handoff_context_apply_record_preview",
  );
  if (
    idempotencyKey &&
    typeof decisionMaterial?.requested_idempotency_key === "string" &&
    decisionMaterial.requested_idempotency_key !== idempotencyKey
  ) {
    reasons.push("idempotency_key_mismatch_with_decision_preview");
  }
  const approval = getRecord(input, "operator_approval");
  reasons.push(...validateApproval({ approval, decisionMaterial }));
  if (recordMaterial) reasons.push(...validateRecordMaterial(recordMaterial));
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
        ? (input as unknown as HandoffContextApplyWriteInput)
        : null,
    idempotency_key: idempotencyKey,
  });
}

export function writeHandoffContextApplyRecordV01(
  input: unknown,
  options: { db: HandoffContextApplyWriteDbLike },
): HandoffContextApplyStoreResult {
  const validation = validateHandoffContextApplyWriteInputV01(input);
  if (!validation.ok || !validation.input || !validation.idempotency_key) {
    return storeResult(
      "refused",
      null,
      [],
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

  ensureHandoffContextApplyWriteSchemaV01(options.db);
  const record = buildRecord(
    validation as ValidationResult & {
      ok: true;
      input: HandoffContextApplyWriteInput;
      idempotency_key: string;
    },
  );
  const existing = readHandoffContextApplyRecordByIdempotencyKeyV01(
    record.idempotency_key,
    { db: options.db },
  ).record;
  if (existing) {
    if (existing.record_fingerprint === record.record_fingerprint) {
      return storeResult(
        "idempotent_existing",
        existing,
        [existing],
        existing.applied_snapshot,
        [existing.applied_snapshot],
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
      existing.applied_snapshot,
      [existing.applied_snapshot],
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
        `INSERT INTO handoff_context_apply_records (
          record_id,
          idempotency_key,
          created_at,
          scope,
          operator_ref,
          record_fingerprint,
          applied_snapshot_ref,
          record_json,
          applied_snapshot_json,
          receipt_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        record.record_id,
        record.idempotency_key,
        record.created_at,
        record.scope,
        validation.input.operator_approval.operator_ref,
        record.record_fingerprint,
        record.applied_handoff_context_snapshot_ref,
        JSON.stringify(record),
        JSON.stringify(record.applied_snapshot),
        JSON.stringify(receipt),
      );
    options.db.prepare("COMMIT").run();
    transactionStarted = false;
    return storeResult(
      "written",
      record,
      [record],
      record.applied_snapshot,
      [record.applied_snapshot],
      receipt,
    );
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

export function refuseHandoffContextApplyWriteV01(
  input: unknown,
  extraReasons: string[] = [],
): HandoffContextApplyStoreResult {
  const validation = validateHandoffContextApplyWriteInputV01(input);
  return storeResult(
    "refused",
    null,
    [],
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

export function readHandoffContextApplyRecordByIdV01(
  recordId: string,
  options: { db: HandoffContextApplyWriteDbLike },
): HandoffContextApplyStoreResult {
  if (!handoffContextApplyWriteSchemaExistsV01(options.db)) {
    return schemaMissingResult(null);
  }
  const row = options.db
    .prepare(
      `SELECT * FROM handoff_context_apply_records
       WHERE record_id = ? AND scope = ?`,
    )
    .get(recordId, HANDOFF_CONTEXT_APPLY_WRITE_SCOPE) as
    | HandoffContextApplyWriteRow
    | undefined;
  if (!row) return notFoundResult(null);
  return rowStoreResult("read", row);
}

export function readHandoffContextApplyRecordByIdempotencyKeyV01(
  idempotencyKey: string,
  options: { db: HandoffContextApplyWriteDbLike },
): HandoffContextApplyStoreResult {
  if (!handoffContextApplyWriteSchemaExistsV01(options.db)) {
    return schemaMissingResult(idempotencyKey);
  }
  const row = options.db
    .prepare(
      `SELECT * FROM handoff_context_apply_records
       WHERE idempotency_key = ? AND scope = ?`,
    )
    .get(idempotencyKey, HANDOFF_CONTEXT_APPLY_WRITE_SCOPE) as
    | HandoffContextApplyWriteRow
    | undefined;
  if (!row) return notFoundResult(idempotencyKey);
  return rowStoreResult("read", row);
}

export function readHandoffContextApplyRecordByAppliedSnapshotRefV01(
  appliedSnapshotRef: string,
  options: { db: HandoffContextApplyWriteDbLike },
): HandoffContextApplyStoreResult {
  if (!handoffContextApplyWriteSchemaExistsV01(options.db)) {
    return schemaMissingResult(null);
  }
  const row = options.db
    .prepare(
      `SELECT * FROM handoff_context_apply_records
       WHERE applied_snapshot_ref = ? AND scope = ?
       ORDER BY created_at DESC, record_id DESC
       LIMIT 1`,
    )
    .get(appliedSnapshotRef, HANDOFF_CONTEXT_APPLY_WRITE_SCOPE) as
    | HandoffContextApplyWriteRow
    | undefined;
  if (!row) return notFoundResult(null);
  return rowStoreResult("read", row);
}

export function readLatestAppliedHandoffContextSnapshotV01(
  options: { db: HandoffContextApplyWriteDbLike },
): HandoffContextApplyStoreResult {
  if (!handoffContextApplyWriteSchemaExistsV01(options.db)) {
    return schemaMissingResult(null);
  }
  const row = options.db
    .prepare(
      `SELECT * FROM handoff_context_apply_records
       WHERE scope = ?
       ORDER BY created_at DESC, record_id DESC
       LIMIT 1`,
    )
    .get(HANDOFF_CONTEXT_APPLY_WRITE_SCOPE) as
    | HandoffContextApplyWriteRow
    | undefined;
  if (!row) return notFoundResult(null);
  return rowStoreResult("read", row);
}

export function listHandoffContextApplyRecordsV01(
  options: { db: HandoffContextApplyWriteDbLike } &
    HandoffContextApplyWriteListOptions,
): HandoffContextApplyStoreResult {
  if (!handoffContextApplyWriteSchemaExistsV01(options.db)) {
    return schemaMissingResult(options.idempotency_key ?? null);
  }
  const clauses = ["scope = ?"];
  const params: unknown[] = [HANDOFF_CONTEXT_APPLY_WRITE_SCOPE];
  if (options.idempotency_key) {
    clauses.push("idempotency_key = ?");
    params.push(options.idempotency_key);
  }
  if (options.operator_ref) {
    clauses.push("operator_ref = ?");
    params.push(options.operator_ref);
  }
  if (options.applied_handoff_context_snapshot_ref) {
    clauses.push("applied_snapshot_ref = ?");
    params.push(options.applied_handoff_context_snapshot_ref);
  }
  const limit = Math.max(1, Math.min(options.limit ?? 50, 100));
  const rows = options.db
    .prepare(
      `SELECT * FROM handoff_context_apply_records
       WHERE ${clauses.join(" AND ")}
       ORDER BY created_at DESC, record_id DESC
       LIMIT ?`,
    )
    .all(...params, limit) as HandoffContextApplyWriteRow[];
  const records = rows.map(rowToRecord);
  const snapshots = rows.map(rowToSnapshot);
  return storeResult(
    "listed",
    records[0] ?? null,
    records,
    snapshots[0] ?? null,
    snapshots,
    rows[0]?.receipt_json
      ? rowToReceipt(rows[0])
      : createRefusedReceipt([], options.idempotency_key ?? null),
  );
}

export function createHandoffContextApplyWriteAuthorityBoundaryV01({
  writeNow,
}: {
  writeNow: boolean;
}): HandoffContextApplyWriteAuthorityBoundary {
  return {
    durable_local_handoff_context_apply_record: true,
    durable_local_applied_handoff_context_snapshot: true,
    source_of_truth: false,
    local_project_handoff_context_apply_only: true,
    can_write_db: writeNow,
    can_create_handoff_context_apply_record: writeNow,
    can_create_handoff_context_apply_receipt: writeNow,
    can_create_applied_handoff_context_snapshot: writeNow,
    can_apply_handoff_context_update_to_local_snapshot: writeNow,
    can_apply_handoff_context_update_live: false,
    can_mutate_handoff_context: false,
    can_send_handoff: false,
    can_copy_export_handoff_packet: false,
    can_write_selected_refs_to_live_handoff: false,
    can_modify_api_perspective_current_route: false,
    can_replace_current_working_perspective_route_response: false,
    can_update_upstream_current_working_perspective_source_tables: false,
    can_write_applied_current_working_perspective_snapshot: false,
    can_write_current_working_perspective_apply_record: false,
    can_write_current_working_perspective_update_contract_record: false,
    can_write_route_integration_contract_record: false,
    can_write_handoff_context_update_contract_record: false,
    can_write_perspective_unit: false,
    can_write_next_work_bias: false,
    can_write_continuity_relay: false,
    can_update_continuity_relay: false,
    can_apply_live_relay_state: false,
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
      "Authority is limited to a scoped local Handoff Context apply record, receipt, and applied snapshot.",
      "This writer cannot send or copy/export handoff, mutate live handoff context, write selected refs, route state, scoped CWP/Perspective/Relay records, memory, metrics, or external systems.",
    ],
  };
}

function validateDecisionPreview(preview: Record<string, unknown> | null): string[] {
  if (!preview) return ["apply_decision_preview_missing"];
  const reasons: string[] = [];
  if (preview.preview_version !== HANDOFF_CONTEXT_APPLY_DECISION_PREVIEW_VERSION) {
    reasons.push("apply_decision_preview_version_invalid");
  }
  if (preview.scope !== HANDOFF_CONTEXT_APPLY_WRITE_SCOPE) {
    reasons.push("apply_decision_preview_scope_invalid");
  }
  if (
    preview.decision_preview_status !==
    "ready_for_future_handoff_context_apply_record_write"
  ) {
    reasons.push("apply_decision_preview_not_ready_for_handoff_context_apply_record_write");
  }
  if (
    preview.recommended_operator_decision !==
    "approve_for_handoff_context_apply_record"
  ) {
    reasons.push("apply_decision_preview_recommended_decision_not_approve");
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
    reasons.push("apply_decision_preview_write_readiness_invalid");
  }
  const decisionMaterial = getRecord(
    preview,
    "would_write_handoff_context_apply_decision_preview",
  );
  if (!decisionMaterial) {
    reasons.push("apply_decision_preview_write_material_missing");
  } else {
    reasons.push(...validateApplyPreview(getRecord(decisionMaterial, "contract_preview")));
  }
  const authority = getRecord(preview, "authority_boundary");
  if (!authority || !hasReadOnlyDecisionAuthority(authority)) {
    reasons.push("apply_decision_preview_authority_boundary_invalid");
  }
  return reasons;
}

function validateApplyPreview(preview: Record<string, unknown> | null): string[] {
  if (!preview) return ["handoff_context_apply_preview_missing"];
  const reasons: string[] = [];
  if (preview.preview_version !== HANDOFF_CONTEXT_APPLY_PREVIEW_VERSION) {
    reasons.push("handoff_context_apply_preview_version_invalid");
  }
  if (
    preview.apply_preview_status !==
    "ready_for_future_handoff_context_apply_record_write"
  ) {
    reasons.push("handoff_context_apply_preview_not_ready");
  }
  const readiness = getRecord(preview, "apply_readiness");
  if (!readiness || readiness.write_ready !== true) {
    reasons.push("handoff_context_apply_preview_readiness_invalid");
  }
  const recordMaterial = getRecord(
    preview,
    "would_write_handoff_context_apply_record_preview",
  );
  if (!recordMaterial) {
    reasons.push("handoff_context_apply_record_material_missing");
  } else {
    reasons.push(...validateRecordMaterial(recordMaterial));
  }
  const authority = getRecord(preview, "authority_boundary");
  if (!authority || !hasReadOnlyApplyPreviewAuthority(authority)) {
    reasons.push("handoff_context_apply_preview_authority_boundary_invalid");
  }
  return reasons;
}

function validateApproval({
  approval,
  decisionMaterial,
}: {
  approval: Record<string, unknown> | null;
  decisionMaterial: Record<string, unknown> | null;
}): string[] {
  if (!approval) return ["operator_approval_missing"];
  const reasons: string[] = [];
  if (approval.operator_decision !== "approve_for_handoff_context_apply_record") {
    reasons.push("operator_approval_decision_invalid");
  }
  for (const key of [
    "approved_by",
    "operator_ref",
    "approved_at",
    "approval_statement",
  ]) {
    if (!safeRef(approval[key])) reasons.push(`operator_approval_${key}_invalid`);
  }
  if (
    decisionMaterial?.requested_operator_ref &&
    approval.operator_ref !== decisionMaterial.requested_operator_ref
  ) {
    reasons.push("operator_ref_mismatch_with_decision_preview");
  }
  const confirmations = Array.isArray(approval.checklist_confirmations)
    ? approval.checklist_confirmations
    : [];
  if (!confirmations.length || !confirmations.every(safeRef)) {
    reasons.push("operator_approval_checklist_confirmations_invalid");
  }
  return reasons;
}

function validateRecordMaterial(material: Record<string, unknown>): string[] {
  const reasons: string[] = [];
  if (material.record_version !== HANDOFF_CONTEXT_APPLY_RECORD_VERSION) {
    reasons.push("handoff_context_apply_record_version_invalid");
  }
  if (material.scope !== HANDOFF_CONTEXT_APPLY_WRITE_SCOPE) {
    reasons.push("handoff_context_apply_record_scope_invalid");
  }
  for (const key of [
    "requested_operator_ref",
    "requested_idempotency_key",
    "review_confirmation_ref",
    "source_handoff_context_update_contract_record_ref",
  ]) {
    if (!safeRef(material[key])) reasons.push(`${key}_missing_or_invalid`);
  }
  for (const key of ["source_refs", "evidence_refs"]) {
    const refs = Array.isArray(material[key]) ? material[key] : [];
    if (!refs.length || !refs.every(safeRef)) reasons.push(`${key}_missing_or_invalid`);
  }
  const applied = getRecord(material, "proposed_applied_handoff_context");
  if (!isAppliedHandoffContextLike(applied)) {
    reasons.push("applied_handoff_context_snapshot_malformed");
  }
  const plan = getRecord(material, "proposed_handoff_context_apply_plan");
  if (!isApplyPlanLike(plan)) {
    reasons.push("handoff_context_apply_plan_malformed");
  }
  const authority = getRecord(applied, "authority_boundary");
  if (authority && !hasReadOnlyApplyPreviewAuthority(authority)) {
    reasons.push("applied_handoff_context_authority_boundary_invalid");
  }
  return reasons;
}

function buildRecord(
  validation: ValidationResult & {
    ok: true;
    input: HandoffContextApplyWriteInput;
    idempotency_key: string;
  },
): HandoffContextApplyRecord {
  const decisionPreview = validation.input.apply_decision_preview;
  const decisionMaterial =
    decisionPreview.would_write_handoff_context_apply_decision_preview;
  const applyPreview = decisionMaterial.contract_preview;
  if (!applyPreview) {
    throw new Error("validated handoff apply material missing apply preview");
  }
  const material = applyPreview
    .would_write_handoff_context_apply_record_preview;
  const createdAt =
    validation.input.operator_approval.approved_at || new Date().toISOString();
  const appliedContext = material.proposed_applied_handoff_context;
  if (!appliedContext) {
    throw new Error("validated handoff apply material missing applied context");
  }
  const appliedFingerprint = fingerprint({
    version: APPLIED_HANDOFF_CONTEXT_SNAPSHOT_VERSION,
    appliedContext,
  });
  const snapshotRef = `applied-handoff-context-snapshot:${appliedFingerprint.slice(0, 24)}`;
  const snapshot: AppliedHandoffContextSnapshot = {
    snapshot_version: APPLIED_HANDOFF_CONTEXT_SNAPSHOT_VERSION,
    applied_handoff_context_snapshot_ref: snapshotRef,
    scope: HANDOFF_CONTEXT_APPLY_WRITE_SCOPE,
    as_of: createdAt,
    source_handoff_context_update_contract_record_ref:
      material.source_handoff_context_update_contract_record_ref ?? "",
    source_route_integration_read_ref: material.source_route_integration_read_ref,
    source_runtime_current_working_perspective_ref:
      material.source_runtime_current_working_perspective_ref,
    source_applied_snapshot_ref: material.source_applied_snapshot_ref,
    applied_handoff_context: appliedContext,
    applied_handoff_context_entries: appliedContext.applied_entries,
    applied_entry_count: appliedContext.applied_entries.length,
    source_refs: material.source_refs,
    evidence_refs: material.evidence_refs,
    authority_boundary: createHandoffContextApplyWriteAuthorityBoundaryV01({
      writeNow: true,
    }),
  };
  const recordBase = {
    record_version: HANDOFF_CONTEXT_APPLY_RECORD_VERSION,
    idempotency_key: validation.idempotency_key,
    created_at: createdAt,
    scope: HANDOFF_CONTEXT_APPLY_WRITE_SCOPE,
    operator_ref: validation.input.operator_approval.operator_ref,
    source_refs: material.source_refs,
    evidence_refs: material.evidence_refs,
    source_handoff_context_update_contract_record_ref:
      material.source_handoff_context_update_contract_record_ref ?? "",
    source_handoff_context_update_contract_record_refs:
      material.source_handoff_context_update_contract_record_refs,
    source_route_integration_read_ref: material.source_route_integration_read_ref,
    source_runtime_current_working_perspective_ref:
      material.source_runtime_current_working_perspective_ref,
    source_applied_snapshot_ref: material.source_applied_snapshot_ref,
    applied_snapshot_version: APPLIED_HANDOFF_CONTEXT_SNAPSHOT_VERSION,
    applied_handoff_context_snapshot_ref: snapshotRef,
    applied_handoff_context: appliedContext,
    applied_handoff_context_fingerprint: appliedFingerprint,
    applied_snapshot: snapshot,
    applied_handoff_context_entries: appliedContext.applied_entries,
    applied_handoff_context_entry_count: appliedContext.applied_entries.length,
    applied_handoff_section_counts:
      material.proposed_handoff_context_apply_plan.section_counts,
    apply_plan: material.proposed_handoff_context_apply_plan,
    authority_profile: createAuthorityProfile(),
    review_status: "applied_as_scoped_handoff_context_snapshot" as const,
    persistence_horizon: "local_project_handoff_context_apply_store" as const,
    no_handoff_send_performed: createNoHandoffSend(),
    write_validation: createWriteValidation({
      decisionPreview,
      material,
      appliedFingerprint,
    }),
    authority_boundary: createHandoffContextApplyWriteAuthorityBoundaryV01({
      writeNow: true,
    }),
    notes: publicSafeRefs(validation.input.notes ?? []),
  };
  const recordFingerprint = fingerprint(recordBase);
  return {
    ...recordBase,
    record_id: `handoff-context-apply:${recordFingerprint.slice(0, 24)}`,
    record_fingerprint: recordFingerprint,
  };
}

function createAuthorityProfile(): HandoffContextApplyAuthorityProfile {
  return {
    durable_local_handoff_context_apply_record: true,
    durable_local_applied_handoff_context_snapshot: true,
    source_of_truth: false,
    local_project_handoff_context_apply_only: true,
    persistence_horizon: "local_project_handoff_context_apply_store",
    handoff_context_apply_record_written: true,
    applied_handoff_context_snapshot_written: true,
    handoff_context_update_applied_to_local_snapshot: true,
    live_handoff_context_mutated: false,
    handoff_sent: false,
    selected_refs_written_to_live_handoff: false,
    handoff_packet_copy_exported: false,
    handoff_packet_sent: false,
    api_perspective_current_route_modified: false,
    upstream_current_working_perspective_source_tables_mutated: false,
    applied_current_working_perspective_snapshot_written: false,
    current_working_perspective_apply_record_written: false,
    route_integration_contract_record_written: false,
    handoff_context_update_contract_record_written: false,
    perspective_unit_write_performed: false,
    next_work_bias_write_performed: false,
    continuity_relay_write_performed: false,
    continuity_relay_update_performed: false,
    memory_promotion_performed: false,
    metric_update_performed: false,
  };
}

function createWriteValidation({
  decisionPreview,
  material,
  appliedFingerprint,
}: {
  decisionPreview: HandoffContextApplyOperatorDecisionPreview;
  material: unknown;
  appliedFingerprint: string;
}): HandoffContextApplyWriteValidation {
  return {
    validation_version: "handoff_context_apply_write_validation.v0.1",
    operator_decision_preview_revalidated: true,
    applied_handoff_context_snapshot_revalidated: true,
    apply_plan_revalidated: true,
    refused_sample_fixture_default_or_smoke_material: false,
    refused_unrequested_side_effects: false,
    refused_live_handoff_send_or_copy_export: false,
    refused_metric_or_upstream_write: false,
    validation_hash: fingerprint({
      decision_preview_version: decisionPreview.preview_version,
      material,
      appliedFingerprint,
    }),
  };
}

function createReceipt({
  validation,
  wrote,
  refused,
  idempotentReplay,
  record,
}: {
  validation:
    | ValidationResult
    | { idempotency_key: string | null; refusal_reasons: string[] };
  wrote: boolean;
  refused: boolean;
  idempotentReplay: boolean;
  record: HandoffContextApplyRecord | null;
}): HandoffContextApplyReceipt {
  return {
    receipt_version: HANDOFF_CONTEXT_APPLY_RECEIPT_VERSION,
    record_id: record?.record_id ?? null,
    idempotency_key: validation.idempotency_key,
    wrote,
    idempotent_replay: idempotentReplay,
    created_at: new Date().toISOString(),
    refused,
    refusal_reasons: validation.refusal_reasons,
    validation_hash: record?.write_validation.validation_hash ?? null,
    record_fingerprint: record?.record_fingerprint ?? null,
    store_ref: record ? "handoff_context_apply_store.v0.1" : null,
    source_refs: record?.source_refs ?? [],
    no_side_effects: createNoSideEffects(wrote),
  };
}

function storeResult(
  status: HandoffContextApplyWriteStatus,
  record: HandoffContextApplyRecord | null,
  records: HandoffContextApplyRecord[],
  appliedSnapshot: AppliedHandoffContextSnapshot | null,
  appliedSnapshots: AppliedHandoffContextSnapshot[],
  receipt: HandoffContextApplyReceipt,
): HandoffContextApplyStoreResult {
  return {
    store_version: HANDOFF_CONTEXT_APPLY_STORE_VERSION,
    scope: HANDOFF_CONTEXT_APPLY_WRITE_SCOPE,
    status,
    ok:
      status === "written" ||
      status === "idempotent_existing" ||
      status === "read" ||
      status === "listed",
    record,
    records,
    applied_snapshot: appliedSnapshot,
    applied_snapshots: appliedSnapshots,
    receipt,
    error_code:
      status === "refused" || status === "not_found" || status === "schema_missing"
        ? status
        : null,
    no_side_effects: receipt.no_side_effects,
  };
}

function rowStoreResult(
  status: HandoffContextApplyWriteStatus,
  row: HandoffContextApplyWriteRow,
): HandoffContextApplyStoreResult {
  const record = rowToRecord(row);
  const snapshot = rowToSnapshot(row);
  return storeResult(status, record, [record], snapshot, [snapshot], rowToReceipt(row));
}

function schemaMissingResult(
  idempotencyKey: string | null,
): HandoffContextApplyStoreResult {
  return storeResult(
    "schema_missing",
    null,
    [],
    null,
    [],
    createRefusedReceipt(["schema_missing"], idempotencyKey),
  );
}

function notFoundResult(idempotencyKey: string | null): HandoffContextApplyStoreResult {
  return storeResult(
    "not_found",
    null,
    [],
    null,
    [],
    createRefusedReceipt(["record_not_found"], idempotencyKey),
  );
}

function createRefusedReceipt(
  refusalReasons: string[],
  idempotencyKey: string | null,
): HandoffContextApplyReceipt {
  return createReceipt({
    validation: {
      idempotency_key: idempotencyKey,
      refusal_reasons: refusalReasons,
    },
    wrote: false,
    refused: refusalReasons.length > 0,
    idempotentReplay: false,
    record: null,
  });
}

function createNoSideEffects(wrote: boolean): HandoffContextApplyNoSideEffects {
  return {
    handoff_context_apply_record_written: wrote,
    handoff_context_apply_receipt_written: wrote,
    handoff_context_apply_persisted: wrote,
    applied_handoff_context_snapshot_written: wrote,
    handoff_context_update_applied_to_local_snapshot: wrote,
    ...createNoHandoffSend(),
  };
}

function createNoHandoffSend(): HandoffContextApplyNoHandoffSend {
  return {
    live_handoff_context_updated: false,
    live_handoff_context_mutated: false,
    handoff_context_applied_live: false,
    handoff_context_mutated: false,
    handoff_sent: false,
    selected_refs_written_to_live_handoff: false,
    handoff_packet_copy_exported: false,
    handoff_packet_sent: false,
    api_perspective_current_route_modified: false,
    current_working_perspective_route_response_replaced: false,
    upstream_current_working_perspective_source_tables_updated: false,
    upstream_current_working_perspective_source_tables_mutated: false,
    applied_current_working_perspective_snapshot_written: false,
    current_working_perspective_apply_record_written: false,
    current_working_perspective_update_contract_record_written: false,
    route_integration_contract_record_written: false,
    handoff_context_update_contract_record_written: false,
    perspective_unit_written: false,
    next_work_bias_written: false,
    continuity_relay_written: false,
    continuity_relay_updated: false,
    live_relay_state_applied: false,
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

function isAppliedHandoffContextLike(value: Record<string, unknown> | null): boolean {
  if (!value) return false;
  const metadata = getRecord(value, "apply_metadata");
  const authority = getRecord(value, "authority_boundary");
  return (
    value.handoff_context_version === "applied_handoff_context.v0.1" &&
    value.scope === HANDOFF_CONTEXT_APPLY_WRITE_SCOPE &&
    typeof value.as_of === "string" &&
    typeof value.source_contract_record_ref === "string" &&
    Array.isArray(value.source_refs) &&
    value.source_refs.every(safeRef) &&
    Array.isArray(value.evidence_refs) &&
    value.evidence_refs.every(safeRef) &&
    isRecord(value.handoff_sections) &&
    Array.isArray(value.applied_entries) &&
    value.applied_entries.length > 0 &&
    value.applied_entries.every(isAppliedEntryLike) &&
    metadata?.local_snapshot_only === true &&
    metadata.does_not_send_handoff === true &&
    metadata.does_not_write_live_packet === true &&
    hasReadOnlyApplyPreviewAuthority(authority)
  );
}

function isAppliedEntryLike(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    typeof value.applied_entry_ref === "string" &&
    typeof value.source_contract_entry_ref === "string" &&
    typeof value.handoff_section === "string" &&
    typeof value.entry_kind === "string" &&
    typeof value.summary === "string" &&
    Array.isArray(value.source_refs) &&
    value.source_refs.every(safeRef) &&
    Array.isArray(value.evidence_refs) &&
    value.evidence_refs.every(safeRef) &&
    value.applied_status === "applied_to_local_handoff_context_snapshot"
  );
}

function isApplyPlanLike(value: Record<string, unknown> | null): boolean {
  return Boolean(
    value &&
      value.plan_version === "handoff_context_apply_plan.v0.1" &&
      typeof value.source_contract_record_ref === "string" &&
      typeof value.entry_count === "number" &&
      value.entry_count > 0 &&
      isRecord(value.section_counts) &&
      Array.isArray(value.applied_entry_refs) &&
      value.no_handoff_send_or_copy_export === true &&
      value.no_live_handoff_context_mutation === true,
  );
}

function hasReadOnlyApplyPreviewAuthority(
  authority: Record<string, unknown> | null,
): boolean {
  return Boolean(
    authority &&
      authority.read_only === true &&
      authority.advisory_only === true &&
      authority.apply_preview_only === true &&
      authority.source_of_truth === false &&
      fieldsFalse(authority, readOnlyAuthorityRequiredFalseFields) &&
      optionalFieldsFalse(authority, readOnlyAuthorityOptionalFalseFields),
  );
}

function hasReadOnlyDecisionAuthority(
  authority: Record<string, unknown>,
): boolean {
  return Boolean(
    authority &&
      authority.read_only === true &&
      authority.advisory_only === true &&
      authority.decision_preview_only === true &&
      authority.source_of_truth === false &&
      fieldsFalse(authority, readOnlyAuthorityRequiredFalseFields) &&
      optionalFieldsFalse(authority, readOnlyAuthorityOptionalFalseFields),
  );
}

function fieldsFalse(
  value: Record<string, unknown>,
  fields: readonly string[],
): boolean {
  return fields.every((field) => value[field] === false);
}

function optionalFieldsFalse(
  value: Record<string, unknown>,
  fields: readonly string[],
): boolean {
  return fields.every((field) => !(field in value) || value[field] === false);
}

function findRequestedSideEffectRefusals(value: unknown): string[] {
  if (!isRecord(value)) return [];
  const reasons: string[] = [];
  for (const [key, candidate] of Object.entries(value)) {
    if (allowedRequestedSideEffectKeys.has(key)) continue;
    if (candidate === true || candidate === "true") {
      reasons.push(`forbidden_requested_side_effect_${key}`);
    }
    if (forbiddenRequestedSideEffectPatterns.some((pattern) => pattern.test(key))) {
      reasons.push(`forbidden_requested_side_effect_${key}`);
    }
  }
  return reasons;
}

function containsRawOrPrivateMarkers(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") {
    return containsCandidateIngressUnsafeMarkerV01(value);
  }
  if (Array.isArray(value)) return value.some(containsRawOrPrivateMarkers);
  if (!isRecord(value)) return false;
  return Object.entries(value).some(
    ([key, entry]) =>
      ["raw_text", "raw_report", "raw_excerpt"].includes(key) ||
      containsRawOrPrivateMarkers(entry),
  );
}

function containsSampleDefaultOrSmokeMaterial(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    return sampleDefaultOrSmokeMarkers.some((marker) =>
      normalized.includes(marker),
    );
  }
  if (Array.isArray(value)) return value.some(containsSampleDefaultOrSmokeMaterial);
  if (!isRecord(value)) return false;
  return Object.values(value).some(containsSampleDefaultOrSmokeMaterial);
}

function validateNotes(value: unknown): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return ["notes_must_be_array"];
  return value.every(safeRef) ? [] : ["notes_contain_unsafe_ref"];
}

function validationResult({
  refusal_reasons,
  input,
  idempotency_key,
}: {
  refusal_reasons: string[];
  input: HandoffContextApplyWriteInput | null;
  idempotency_key: string | null;
}): ValidationResult {
  const unique = uniqueCandidateIngressStringsV01(refusal_reasons);
  return {
    ok: unique.length === 0 && Boolean(input) && Boolean(idempotency_key),
    refusal_reasons: unique,
    input,
    idempotency_key,
  };
}

function rowToRecord(row: HandoffContextApplyWriteRow): HandoffContextApplyRecord {
  return JSON.parse(row.record_json) as HandoffContextApplyRecord;
}

function rowToSnapshot(
  row: HandoffContextApplyWriteRow,
): AppliedHandoffContextSnapshot {
  return JSON.parse(row.applied_snapshot_json) as AppliedHandoffContextSnapshot;
}

function rowToReceipt(row: HandoffContextApplyWriteRow): HandoffContextApplyReceipt {
  return JSON.parse(row.receipt_json) as HandoffContextApplyReceipt;
}

function getRecord(
  value: unknown,
  key: string,
): Record<string, unknown> | null {
  if (!isRecord(value)) return null;
  const candidate = value[key];
  return isRecord(candidate) ? candidate : null;
}

function publicSafeRefs(values: unknown[]): string[] {
  return uniqueCandidateIngressStringsV01(values).filter(
    isCandidateIngressPublicSafeRefV01,
  );
}

function safeRef(value: unknown): value is string {
  return isCandidateIngressPublicSafeRefV01(value);
}

function arrayLength(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function fingerprint(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
