import { createHash } from "node:crypto";

import {
  containsCandidateIngressUnsafeMarkerV01,
  isCandidateIngressPublicSafeRefV01,
  uniqueCandidateIngressStringsV01,
} from "@/lib/intake/candidate-ingress-normalizer";
import {
  HANDOFF_SEND_DECISION_PREVIEW_VERSION,
} from "@/types/handoff-send-decision";
import {
  HANDOFF_SEND_PREVIEW_VERSION,
  type HandoffSendFulfillment,
} from "@/types/handoff-send-preview";
import {
  HANDOFF_SEND_RECEIPT_VERSION,
  HANDOFF_SEND_RECORD_VERSION,
  HANDOFF_SEND_STORE_VERSION,
  HANDOFF_SEND_WRITE_SCOPE,
  type HandoffSendAuthorityProfile,
  type HandoffSendNoForbiddenSideEffects,
  type HandoffSendNoSideEffects,
  type HandoffSendReceipt,
  type HandoffSendRecord,
  type HandoffSendStoreResult,
  type HandoffSendWriteAuthorityBoundary,
  type HandoffSendWriteInput,
  type HandoffSendWriteStatus,
  type HandoffSendWriteValidation,
} from "@/types/handoff-send-write";

export const HANDOFF_SEND_WRITE_TABLE = "handoff_send_records" as const;

export interface HandoffSendWriteDbLike {
  exec(sql: string): unknown;
  prepare(sql: string): {
    run(...params: unknown[]): unknown;
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  };
}

export interface HandoffSendWriteListOptions {
  idempotency_key?: string;
  operator_ref?: string;
  source_handoff_send_contract_record_ref?: string;
  source_exported_artifact_ref?: string;
  send_surface?: string;
  delivery_mode?: string;
  recipient_ref?: string;
  fulfillment_status?: string;
  limit?: number;
}

interface HandoffSendWriteRow {
  record_id: string;
  idempotency_key: string;
  created_at: string;
  scope: string;
  operator_ref: string;
  send_surface: string;
  delivery_mode: string;
  recipient_ref: string;
  send_execution_mode: string;
  fulfillment_status: string;
  source_handoff_send_contract_record_ref: string;
  source_exported_artifact_ref: string;
  record_fingerprint: string;
  record_json: string;
  receipt_json: string;
}

interface ValidationResult {
  ok: boolean;
  refusal_reasons: string[];
  input: HandoffSendWriteInput | null;
  idempotency_key: string | null;
}

const approvalIntent = "approve_for_handoff_send_record" as const;

const allowedRequestedSideEffectKeys = new Set([
  "can_write_db",
  "can_create_handoff_send_record",
  "can_create_handoff_send_receipt",
  "can_record_local_send_fulfillment",
  "handoff_send_record_written",
  "handoff_send_receipt_written",
  "handoff_send_persisted",
  "local_handoff_send_fulfillment_recorded",
]);

const forbiddenRequestedSideEffectPatterns = [
  /handoff.*sent|send.*provider|provider.*called|external.*messaging|network.*send/i,
  /email|slack|webhook|notification/i,
  /github|openai|codex.*(execute|transfer)|browser|crawler/i,
  /clipboard|download|arbitrary.*file|packet.*file/i,
  /selected.*refs.*live|live.*handoff|handoff.*context.*(mutate|apply|live)/i,
  /send.*contract.*record.*written/i,
  /copy.*export|exported.*artifact|packet.*export/i,
  /api.*perspective.*current|route.*(modify|replace|mutate|write)/i,
  /current.*working.*perspective.*(source.*table|upstream|snapshot.*write|apply.*record|update.*contract|route.*integration)/i,
  /perspective.*unit|next.*work.*bias|continuity.*relay|live.*relay/i,
  /memory|metric|reuse.*ledger|expected.*observed.*delta|work.*episode/i,
  /\bpr\b.*create|\bpr\b.*merge|autonomous|graph|vector|\brag\b/i,
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

const readOnlyAuthorityFalseFields = [
  "can_write_db",
  "can_create_handoff_send_record",
  "can_create_handoff_send_receipt",
  "can_record_local_send_fulfillment",
  "can_send_handoff",
  "can_call_send_provider",
  "can_call_provider_openai",
  "can_call_github",
  "can_call_external_messaging",
  "can_call_email",
  "can_call_slack",
  "can_call_webhook",
  "can_transfer_codex_session",
  "can_call_browser_or_crawler",
  "can_write_clipboard",
  "can_download_file",
  "can_write_arbitrary_file",
  "can_write_handoff_packet_file",
  "can_mutate_handoff_context",
  "can_apply_handoff_context_update_live",
  "can_write_selected_refs_to_live_handoff",
  "can_write_handoff_send_contract_record",
  "can_write_handoff_packet_copy_export_record",
  "can_write_handoff_packet_exported_artifact",
  "can_write_handoff_packet_copy_export_contract_record",
  "can_write_handoff_context_apply_record",
  "can_write_applied_handoff_context_snapshot",
  "can_write_handoff_context_update_contract_record",
  "can_modify_api_perspective_current_route",
  "can_replace_current_working_perspective_route_response",
  "can_update_upstream_current_working_perspective_source_tables",
  "can_write_applied_current_working_perspective_snapshot",
  "can_write_current_working_perspective_apply_record",
  "can_write_current_working_perspective_update_contract_record",
  "can_write_route_integration_contract_record",
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
  "can_execute_codex",
  "can_create_pr",
  "can_merge_pr",
  "can_run_autonomous_action",
  "can_create_graph_or_vector_store",
  "can_create_rag_stack",
  "can_crawl_or_observe_browser",
  "can_render_workbench_action_button",
] as const;

export const handoffSendWriteSchemaSqlV01 = `
CREATE TABLE IF NOT EXISTS handoff_send_records (
  record_id TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  scope TEXT NOT NULL,
  operator_ref TEXT NOT NULL,
  send_surface TEXT NOT NULL,
  delivery_mode TEXT NOT NULL,
  recipient_ref TEXT NOT NULL,
  send_execution_mode TEXT NOT NULL,
  fulfillment_status TEXT NOT NULL,
  source_handoff_send_contract_record_ref TEXT NOT NULL,
  source_exported_artifact_ref TEXT NOT NULL,
  record_fingerprint TEXT NOT NULL,
  record_json TEXT NOT NULL,
  receipt_json TEXT NOT NULL,
  UNIQUE(scope, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_handoff_send_records_scope_created
  ON handoff_send_records(scope, created_at, record_id);

CREATE INDEX IF NOT EXISTS idx_handoff_send_records_operator
  ON handoff_send_records(scope, operator_ref, created_at, record_id);

CREATE INDEX IF NOT EXISTS idx_handoff_send_records_source_contract
  ON handoff_send_records(scope, source_handoff_send_contract_record_ref, created_at, record_id);

CREATE INDEX IF NOT EXISTS idx_handoff_send_records_surface_mode
  ON handoff_send_records(scope, send_surface, delivery_mode, fulfillment_status, created_at, record_id);
`;

export function ensureHandoffSendWriteSchemaV01(
  db: HandoffSendWriteDbLike,
): void {
  db.exec(handoffSendWriteSchemaSqlV01);
}

export function handoffSendWriteSchemaExistsV01(
  db: HandoffSendWriteDbLike,
): boolean {
  const row = db
    .prepare(
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name = ?`,
    )
    .get(HANDOFF_SEND_WRITE_TABLE) as { name?: string } | undefined;
  return row?.name === HANDOFF_SEND_WRITE_TABLE;
}

export function validateHandoffSendWriteInputV01(
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
  const decisionPreview = getRecord(input, "send_decision_preview");
  reasons.push(...validateDecisionPreview(decisionPreview));
  const decisionMaterial = getRecord(
    decisionPreview,
    "would_write_handoff_send_decision_preview",
  );
  const preview = getRecord(decisionMaterial, "handoff_send_preview");
  const recordMaterial = getRecord(
    preview,
    "would_write_handoff_send_record_preview",
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
        ? (input as unknown as HandoffSendWriteInput)
        : null,
    idempotency_key: idempotencyKey,
  });
}

export function writeHandoffSendRecordV01(
  input: unknown,
  options: { db: HandoffSendWriteDbLike },
): HandoffSendStoreResult {
  const validation = validateHandoffSendWriteInputV01(input);
  if (!validation.ok || !validation.input || !validation.idempotency_key) {
    return storeResult(
      "refused",
      null,
      [],
      createReceipt({
        validation: {
          idempotency_key: validation.idempotency_key,
          refusal_reasons: validation.refusal_reasons,
        },
        wrote: false,
        refused: true,
        idempotentReplay: false,
        record: null,
      }),
    );
  }

  ensureHandoffSendWriteSchemaV01(options.db);
  const typedValidation = validation as ValidationResult & {
    ok: true;
    input: HandoffSendWriteInput;
    idempotency_key: string;
  };
  const record = buildRecord(typedValidation);
  const existing = readHandoffSendRecordByIdempotencyKeyV01(
    validation.idempotency_key,
    { db: options.db },
  );
  if (existing.status === "read" && existing.record) {
    if (existing.record.record_fingerprint === record.record_fingerprint) {
      return storeResult(
        "idempotent_existing",
        existing.record,
        [existing.record],
        createReceipt({
          validation: {
            idempotency_key: validation.idempotency_key,
            refusal_reasons: [],
          },
          wrote: false,
          refused: false,
          idempotentReplay: true,
          record: existing.record,
        }),
      );
    }
    return storeResult(
      "conflict",
      existing.record,
      [existing.record],
      createReceipt({
        validation: {
          idempotency_key: validation.idempotency_key,
          refusal_reasons: ["idempotency_key_conflict"],
        },
        wrote: false,
        refused: true,
        idempotentReplay: false,
        record: existing.record,
      }),
    );
  }

  const receipt = createReceipt({
    validation: {
      idempotency_key: validation.idempotency_key,
      refusal_reasons: [],
    },
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
        `INSERT INTO handoff_send_records (
          record_id,
          idempotency_key,
          created_at,
          scope,
          operator_ref,
          send_surface,
          delivery_mode,
          recipient_ref,
          send_execution_mode,
          fulfillment_status,
          source_handoff_send_contract_record_ref,
          source_exported_artifact_ref,
          record_fingerprint,
          record_json,
          receipt_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        record.record_id,
        record.idempotency_key,
        record.created_at,
        record.scope,
        record.operator_ref,
        record.requested_send_surface,
        record.requested_delivery_mode,
        record.requested_recipient_ref,
        record.requested_send_execution_mode,
        record.fulfillment_status,
        record.source_handoff_send_contract_record_ref,
        record.source_exported_artifact_ref,
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

export function refuseHandoffSendWriteV01(
  input: unknown,
  extraReasons: string[] = [],
): HandoffSendStoreResult {
  const validation = validateHandoffSendWriteInputV01(input);
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

export function readHandoffSendRecordByIdV01(
  recordId: string,
  options: { db: HandoffSendWriteDbLike },
): HandoffSendStoreResult {
  if (!handoffSendWriteSchemaExistsV01(options.db)) return schemaMissingResult(null);
  const row = options.db
    .prepare(
      `SELECT * FROM handoff_send_records
       WHERE record_id = ? AND scope = ?`,
    )
    .get(recordId, HANDOFF_SEND_WRITE_SCOPE) as HandoffSendWriteRow | undefined;
  if (!row) return notFoundResult(null);
  return rowStoreResult("read", row);
}

export function readHandoffSendRecordByIdempotencyKeyV01(
  idempotencyKey: string,
  options: { db: HandoffSendWriteDbLike },
): HandoffSendStoreResult {
  if (!handoffSendWriteSchemaExistsV01(options.db)) return schemaMissingResult(idempotencyKey);
  const row = options.db
    .prepare(
      `SELECT * FROM handoff_send_records
       WHERE idempotency_key = ? AND scope = ?`,
    )
    .get(idempotencyKey, HANDOFF_SEND_WRITE_SCOPE) as
    | HandoffSendWriteRow
    | undefined;
  if (!row) return notFoundResult(idempotencyKey);
  return rowStoreResult("read", row);
}

export function listHandoffSendRecordsV01(
  options: { db: HandoffSendWriteDbLike } & HandoffSendWriteListOptions,
): HandoffSendStoreResult {
  if (!handoffSendWriteSchemaExistsV01(options.db)) {
    return schemaMissingResult(options.idempotency_key ?? null);
  }
  const clauses = ["scope = ?"];
  const params: unknown[] = [HANDOFF_SEND_WRITE_SCOPE];
  for (const [optionKey, column] of [
    ["idempotency_key", "idempotency_key"],
    ["operator_ref", "operator_ref"],
    ["source_handoff_send_contract_record_ref", "source_handoff_send_contract_record_ref"],
    ["source_exported_artifact_ref", "source_exported_artifact_ref"],
    ["send_surface", "send_surface"],
    ["delivery_mode", "delivery_mode"],
    ["recipient_ref", "recipient_ref"],
    ["fulfillment_status", "fulfillment_status"],
  ] as const) {
    const value = options[optionKey];
    if (value) {
      clauses.push(`${column} = ?`);
      params.push(value);
    }
  }
  const limit = Math.max(1, Math.min(options.limit ?? 50, 100));
  const rows = options.db
    .prepare(
      `SELECT * FROM handoff_send_records
       WHERE ${clauses.join(" AND ")}
       ORDER BY created_at DESC, record_id DESC
       LIMIT ?`,
    )
    .all(...params, limit) as HandoffSendWriteRow[];
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

export function createHandoffSendWriteAuthorityBoundaryV01({
  writeNow,
}: {
  writeNow: boolean;
}): HandoffSendWriteAuthorityBoundary {
  return {
    durable_local_handoff_send_record: true,
    source_of_truth: false,
    local_project_handoff_send_only: true,
    can_write_db: writeNow,
    can_create_handoff_send_record: writeNow,
    can_create_handoff_send_receipt: writeNow,
    can_record_local_send_fulfillment: writeNow,
    can_send_handoff: false,
    can_call_send_provider: false,
    can_call_external_messaging: false,
    can_call_email: false,
    can_call_slack: false,
    can_call_webhook: false,
    can_transfer_codex_session: false,
    can_call_browser_or_crawler: false,
    can_write_clipboard: false,
    can_download_file: false,
    can_write_arbitrary_file: false,
    can_write_handoff_packet_file: false,
    can_mutate_handoff_context: false,
    can_apply_handoff_context_update_live: false,
    can_write_selected_refs_to_live_handoff: false,
    can_write_handoff_send_contract_record: false,
    can_write_handoff_packet_copy_export_record: false,
    can_write_handoff_packet_exported_artifact: false,
    can_write_handoff_packet_copy_export_contract_record: false,
    can_write_handoff_context_apply_record: false,
    can_write_applied_handoff_context_snapshot: false,
    can_write_handoff_context_update_contract_record: false,
    can_modify_api_perspective_current_route: false,
    can_replace_current_working_perspective_route_response: false,
    can_update_upstream_current_working_perspective_source_tables: false,
    can_write_applied_current_working_perspective_snapshot: false,
    can_write_current_working_perspective_apply_record: false,
    can_write_current_working_perspective_update_contract_record: false,
    can_write_route_integration_contract_record: false,
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
      "Authority is limited to a scoped local handoff send fulfillment record and receipt row.",
      "This writer cannot send externally, call providers or external messaging systems, transfer Codex sessions, write clipboard, create downloads, write files, mutate handoff context, route state, CWP/Perspective/Relay records, memory, metrics, or external systems.",
    ],
  };
}

function validateDecisionPreview(preview: Record<string, unknown> | null): string[] {
  if (!preview) return ["handoff_send_decision_preview_missing"];
  const reasons: string[] = [];
  if (preview.preview_version !== HANDOFF_SEND_DECISION_PREVIEW_VERSION) {
    reasons.push("handoff_send_decision_preview_version_invalid");
  }
  if (preview.scope !== HANDOFF_SEND_WRITE_SCOPE) {
    reasons.push("handoff_send_decision_preview_scope_invalid");
  }
  if (
    preview.decision_preview_status !==
    "ready_for_future_handoff_send_record_write"
  ) {
    reasons.push("handoff_send_decision_preview_not_ready_for_record_write");
  }
  if (preview.recommended_operator_decision !== approvalIntent) {
    reasons.push("handoff_send_decision_preview_recommended_decision_not_approve");
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
    reasons.push("handoff_send_decision_preview_write_readiness_invalid");
  }
  const decisionMaterial = getRecord(
    preview,
    "would_write_handoff_send_decision_preview",
  );
  if (!decisionMaterial) {
    reasons.push("handoff_send_decision_preview_write_material_missing");
  } else {
    reasons.push(...validateSendPreview(getRecord(decisionMaterial, "handoff_send_preview")));
  }
  const authority = getRecord(preview, "authority_boundary");
  if (!authority || !hasReadOnlyAuthority(authority)) {
    reasons.push("handoff_send_decision_preview_authority_boundary_invalid");
  }
  return reasons;
}

function validateSendPreview(preview: Record<string, unknown> | null): string[] {
  if (!preview) return ["handoff_send_preview_missing"];
  const reasons: string[] = [];
  if (preview.preview_version !== HANDOFF_SEND_PREVIEW_VERSION) {
    reasons.push("handoff_send_preview_version_invalid");
  }
  if (preview.send_preview_status !== "ready_for_future_handoff_send_record_write") {
    reasons.push("handoff_send_preview_not_ready");
  }
  const readiness = getRecord(preview, "send_readiness");
  if (!readiness || readiness.write_ready !== true) {
    reasons.push("handoff_send_preview_readiness_invalid");
  }
  const recordMaterial = getRecord(
    preview,
    "would_write_handoff_send_record_preview",
  );
  if (!recordMaterial) {
    reasons.push("handoff_send_record_material_missing");
  } else {
    reasons.push(...validateRecordMaterial(recordMaterial));
  }
  const authority = getRecord(preview, "authority_boundary");
  if (!authority || !hasReadOnlyAuthority(authority)) {
    reasons.push("handoff_send_preview_authority_boundary_invalid");
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
  if (approval.operator_decision !== approvalIntent) {
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
  if (material.record_version !== HANDOFF_SEND_RECORD_VERSION) {
    reasons.push("handoff_send_record_version_invalid");
  }
  if (material.scope !== HANDOFF_SEND_WRITE_SCOPE) {
    reasons.push("handoff_send_record_scope_invalid");
  }
  for (const key of [
    "requested_operator_ref",
    "requested_idempotency_key",
    "review_confirmation_ref",
    "source_handoff_send_contract_record_ref",
    "source_exported_artifact_ref",
    "requested_recipient_ref",
  ]) {
    if (!safeRef(material[key])) reasons.push(`${key}_missing_or_invalid`);
  }
  for (const key of ["source_refs", "evidence_refs"]) {
    const refs = Array.isArray(material[key]) ? material[key] : [];
    if (!refs.length || !refs.every(safeRef)) reasons.push(`${key}_missing_or_invalid`);
  }
  const fulfillment = getRecord(material, "proposed_handoff_send_fulfillment");
  if (!isHandoffSendFulfillment(fulfillment)) {
    reasons.push("handoff_send_fulfillment_malformed");
  }
  if (
    material.no_actual_external_send_performed !== true ||
    material.no_provider_call_performed !== true ||
    material.no_clipboard_download_file_write_performed !== true
  ) {
    reasons.push("handoff_send_record_no_side_effect_claims_invalid");
  }
  return reasons;
}

function buildRecord(
  validation: ValidationResult & {
    ok: true;
    input: HandoffSendWriteInput;
    idempotency_key: string;
  },
): HandoffSendRecord {
  const decisionPreview = validation.input.send_decision_preview;
  const decisionMaterial =
    decisionPreview.would_write_handoff_send_decision_preview;
  const sendPreview = decisionMaterial.handoff_send_preview;
  if (!sendPreview) throw new Error("validated handoff send material missing preview");
  const material = sendPreview.would_write_handoff_send_record_preview;
  const fulfillment = material.proposed_handoff_send_fulfillment;
  if (!fulfillment) throw new Error("validated handoff send material missing fulfillment");
  const createdAt =
    validation.input.operator_approval.approved_at || new Date().toISOString();
  const recordBase = {
    record_version: HANDOFF_SEND_RECORD_VERSION,
    idempotency_key: validation.idempotency_key,
    created_at: createdAt,
    scope: HANDOFF_SEND_WRITE_SCOPE,
    operator_ref: validation.input.operator_approval.operator_ref,
    source_refs: material.source_refs,
    evidence_refs: material.evidence_refs,
    source_handoff_send_contract_record_ref:
      fulfillment.source_handoff_send_contract_record_ref,
    source_exported_artifact_ref: fulfillment.source_exported_artifact_ref,
    source_handoff_packet_copy_export_record_ref:
      fulfillment.source_handoff_packet_copy_export_record_ref,
    source_handoff_packet_copy_export_contract_record_ref:
      fulfillment.source_handoff_packet_copy_export_contract_record_ref,
    requested_send_surface: fulfillment.requested_send_surface,
    requested_delivery_mode: fulfillment.requested_delivery_mode,
    requested_recipient_ref: fulfillment.requested_recipient_ref,
    requested_send_execution_mode: fulfillment.requested_send_execution_mode,
    manual_delivery_confirmation_ref:
      fulfillment.manual_delivery_confirmation_ref,
    local_queue_ref: fulfillment.local_queue_ref,
    handoff_send_fulfillment: fulfillment,
    fulfillment_status: fulfillment.fulfillment_status,
    payload_hash: fulfillment.payload_hash,
    payload_type: fulfillment.payload_type,
    authority_profile: createAuthorityProfile(),
    review_status: "recorded_as_scoped_local_handoff_send_fulfillment" as const,
    persistence_horizon: "local_project_handoff_send_store" as const,
    no_external_delivery_performed: true as const,
    write_validation: createWriteValidation({
      decisionPreview,
      fulfillment,
    }),
    authority_boundary: createHandoffSendWriteAuthorityBoundaryV01({
      writeNow: true,
    }),
    notes: publicSafeRefs(validation.input.notes ?? []),
  };
  const recordFingerprint = fingerprint(recordBase);
  return {
    ...recordBase,
    record_id: `handoff-send:${recordFingerprint.slice(0, 24)}`,
    record_fingerprint: recordFingerprint,
  };
}

function createAuthorityProfile(): HandoffSendAuthorityProfile {
  return {
    durable_local_handoff_send_record: true,
    source_of_truth: false,
    local_project_handoff_send_only: true,
    persistence_horizon: "local_project_handoff_send_store",
    handoff_send_record_written: true,
    handoff_send_receipt_written: true,
    local_handoff_send_fulfillment_recorded: true,
    handoff_sent: false,
    handoff_sent_externally: false,
    send_provider_called: false,
    external_messaging_called: false,
    email_called: false,
    slack_called: false,
    webhook_called: false,
    provider_called: false,
    github_called: false,
    codex_executed: false,
    codex_session_transferred: false,
    browser_or_crawler_called: false,
    network_send_performed: false,
    clipboard_written: false,
    file_download_created: false,
    arbitrary_file_written: false,
    handoff_packet_file_written: false,
    handoff_packet_copied_to_clipboard: false,
    handoff_packet_exported_to_file: false,
    handoff_packet_download_created: false,
    handoff_packet_copied: false,
    handoff_packet_exported: false,
    live_handoff_context_updated: false,
    live_handoff_context_mutated: false,
    handoff_context_applied_live: false,
    handoff_context_mutated: false,
    selected_refs_written_to_live_handoff: false,
    handoff_send_contract_record_written: false,
    handoff_packet_copy_export_record_written: false,
    handoff_packet_exported_artifact_written: false,
    handoff_packet_copy_export_contract_record_written: false,
    handoff_context_apply_record_written: false,
    applied_handoff_context_snapshot_written: false,
    handoff_context_update_contract_record_written: false,
    api_perspective_current_route_modified: false,
    current_working_perspective_route_response_replaced: false,
    upstream_current_working_perspective_source_tables_updated: false,
    upstream_current_working_perspective_source_tables_mutated: false,
    applied_current_working_perspective_snapshot_written: false,
    current_working_perspective_apply_record_written: false,
    current_working_perspective_update_contract_record_written: false,
    route_integration_contract_record_written: false,
    perspective_unit_written: false,
    perspective_unit_write_performed: false,
    next_work_bias_written: false,
    next_work_bias_write_performed: false,
    continuity_relay_written: false,
    continuity_relay_write_performed: false,
    continuity_relay_updated: false,
    continuity_relay_update_performed: false,
    live_relay_state_applied: false,
    memory_written: false,
    memory_promoted: false,
    memory_mutated: false,
    memory_promotion_performed: false,
    dogfood_metrics_written: false,
    dogfood_metrics_global_state_updated: false,
    dogfood_metric_snapshot_written: false,
    reuse_outcome_ledger_written: false,
    expected_observed_delta_written: false,
    work_episode_written: false,
    metric_update_performed: false,
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

function createWriteValidation({
  decisionPreview,
  fulfillment,
}: {
  decisionPreview: HandoffSendWriteInput["send_decision_preview"];
  fulfillment: HandoffSendFulfillment;
}): HandoffSendWriteValidation {
  const validationHash = fingerprint({
    decision_preview_version: decisionPreview.preview_version,
    fulfillment_ref: fulfillment.fulfillment_ref,
    payload_hash: fulfillment.payload_hash,
  });
  return {
    validation_version: "handoff_send_write_validation.v0.1",
    send_decision_preview_revalidated: true,
    handoff_send_fulfillment_revalidated: true,
    payload_hash_revalidated: true,
    refused_sample_fixture_default_or_smoke_material: false,
    refused_unrequested_side_effects: false,
    refused_external_send_or_provider: false,
    refused_metric_or_upstream_write: false,
    validation_hash: validationHash,
  };
}

function createReceipt({
  validation,
  wrote,
  refused,
  idempotentReplay,
  record,
}: {
  validation: { idempotency_key: string | null; refusal_reasons: string[] };
  wrote: boolean;
  refused: boolean;
  idempotentReplay: boolean;
  record: HandoffSendRecord | null;
}): HandoffSendReceipt {
  return {
    receipt_version: HANDOFF_SEND_RECEIPT_VERSION,
    record_id: record?.record_id ?? null,
    idempotency_key: validation.idempotency_key,
    wrote,
    idempotent_replay: idempotentReplay,
    created_at: new Date().toISOString(),
    refused,
    refusal_reasons: validation.refusal_reasons,
    validation_hash: record?.write_validation.validation_hash ?? null,
    record_fingerprint: record?.record_fingerprint ?? null,
    store_ref: record ? `handoff_send_store.v0.1:${record.record_id}` : null,
    source_refs: record?.source_refs ?? [],
    no_side_effects: createNoSideEffects(wrote),
  };
}

function createNoSideEffects(wrote: boolean): HandoffSendNoSideEffects {
  return {
    handoff_send_record_written: wrote,
    handoff_send_receipt_written: wrote,
    handoff_send_persisted: wrote,
    local_handoff_send_fulfillment_recorded: wrote,
    handoff_sent: false,
    handoff_sent_externally: false,
    send_provider_called: false,
    external_messaging_called: false,
    email_called: false,
    slack_called: false,
    webhook_called: false,
    provider_called: false,
    github_called: false,
    codex_executed: false,
    codex_session_transferred: false,
    browser_or_crawler_called: false,
    network_send_performed: false,
    clipboard_written: false,
    file_download_created: false,
    arbitrary_file_written: false,
    handoff_packet_file_written: false,
    handoff_packet_copied_to_clipboard: false,
    handoff_packet_exported_to_file: false,
    handoff_packet_download_created: false,
    handoff_packet_copied: false,
    handoff_packet_exported: false,
    live_handoff_context_updated: false,
    live_handoff_context_mutated: false,
    handoff_context_applied_live: false,
    handoff_context_mutated: false,
    selected_refs_written_to_live_handoff: false,
    handoff_send_contract_record_written: false,
    handoff_packet_copy_export_record_written: false,
    handoff_packet_exported_artifact_written: false,
    handoff_packet_copy_export_contract_record_written: false,
    handoff_context_apply_record_written: false,
    applied_handoff_context_snapshot_written: false,
    handoff_context_update_contract_record_written: false,
    api_perspective_current_route_modified: false,
    current_working_perspective_route_response_replaced: false,
    upstream_current_working_perspective_source_tables_updated: false,
    upstream_current_working_perspective_source_tables_mutated: false,
    applied_current_working_perspective_snapshot_written: false,
    current_working_perspective_apply_record_written: false,
    current_working_perspective_update_contract_record_written: false,
    route_integration_contract_record_written: false,
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

function storeResult(
  status: HandoffSendWriteStatus,
  record: HandoffSendRecord | null,
  records: HandoffSendRecord[],
  receipt: HandoffSendReceipt,
): HandoffSendStoreResult {
  return {
    store_version: HANDOFF_SEND_STORE_VERSION,
    scope: HANDOFF_SEND_WRITE_SCOPE,
    status,
    ok: ["written", "idempotent_existing", "read", "listed"].includes(status),
    error_code: ["written", "idempotent_existing", "read", "listed"].includes(status)
      ? null
      : status,
    record,
    records,
    receipt,
    notes: [
      "Store persists scoped local handoff send fulfillment records only.",
      "local_handoff_send_fulfillment_recorded true never means external delivery or provider/system calls occurred.",
    ],
  };
}

function schemaMissingResult(idempotencyKey: string | null): HandoffSendStoreResult {
  return storeResult("schema_missing", null, [], createRefusedReceipt(["schema_missing"], idempotencyKey));
}

function notFoundResult(idempotencyKey: string | null): HandoffSendStoreResult {
  return storeResult("not_found", null, [], createRefusedReceipt(["not_found"], idempotencyKey));
}

function createRefusedReceipt(
  refusalReasons: string[],
  idempotencyKey: string | null,
): HandoffSendReceipt {
  return createReceipt({
    validation: { idempotency_key: idempotencyKey, refusal_reasons: refusalReasons },
    wrote: false,
    refused: true,
    idempotentReplay: false,
    record: null,
  });
}

function rowStoreResult(
  status: "read",
  row: HandoffSendWriteRow,
): HandoffSendStoreResult {
  const record = rowToRecord(row);
  return storeResult(status, record, [record], rowToReceipt(row));
}

function rowToRecord(row: HandoffSendWriteRow): HandoffSendRecord {
  return JSON.parse(row.record_json) as HandoffSendRecord;
}

function rowToReceipt(row: HandoffSendWriteRow): HandoffSendReceipt {
  return JSON.parse(row.receipt_json) as HandoffSendReceipt;
}

function isHandoffSendFulfillment(value: unknown): value is HandoffSendFulfillment {
  if (!isRecord(value)) return false;
  const summary = getRecord(value, "no_external_delivery_summary");
  const safety = getRecord(value, "public_safety_summary");
  const authority = getRecord(value, "authority_boundary");
  return Boolean(
    value.fulfillment_version === "handoff_send_fulfillment.v0.1" &&
      safeRef(value.fulfillment_ref) &&
      value.scope === HANDOFF_SEND_WRITE_SCOPE &&
      safeRef(value.source_handoff_send_contract_record_ref) &&
      safeRef(value.source_exported_artifact_ref) &&
      safeRef(value.requested_send_surface) &&
      safeRef(value.requested_delivery_mode) &&
      safeRef(value.requested_recipient_ref) &&
      safeRef(value.requested_send_execution_mode) &&
      safeRef(value.payload_hash) &&
      safeRef(value.payload_type) &&
      safeRef(value.send_envelope_ref) &&
      safeRef(value.fulfillment_status) &&
      safety?.public_safe === true &&
      safety.raw_private_material_excluded === true &&
      summary?.provider_call_performed === false &&
      summary.external_messaging_called === false &&
      summary.email_called === false &&
      summary.slack_called === false &&
      summary.webhook_called === false &&
      summary.github_called === false &&
      summary.codex_transfer_performed === false &&
      summary.browser_or_crawler_called === false &&
      summary.network_send_performed === false &&
      hasReadOnlyAuthority(authority),
  );
}

function hasReadOnlyAuthority(authority: Record<string, unknown> | null): boolean {
  return Boolean(
    authority &&
      authority.read_only === true &&
      authority.source_of_truth === false &&
      fieldsFalse(authority, readOnlyAuthorityFalseFields),
  );
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
  return uniqueCandidateIngressStringsV01(reasons);
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
  input: HandoffSendWriteInput | null;
  idempotency_key: string | null;
}): ValidationResult {
  return {
    ok: refusal_reasons.length === 0,
    refusal_reasons,
    input,
    idempotency_key,
  };
}

function publicSafeRefs(values: unknown[]): string[] {
  return values.filter((value): value is string => safeRef(value) !== null);
}

function safeRef(value: unknown): string | null {
  return isCandidateIngressPublicSafeRefV01(value) ? value : null;
}

function getRecord(value: unknown, key: string): Record<string, unknown> | null {
  if (!isRecord(value)) return null;
  return isRecord(value[key]) ? value[key] : null;
}

function fieldsFalse(value: Record<string, unknown>, fields: readonly string[]): boolean {
  return fields.every((field) => value[field] === false);
}

function arrayLength(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function fingerprint(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
