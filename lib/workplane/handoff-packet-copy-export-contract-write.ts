import { createHash } from "node:crypto";

import {
  containsCandidateIngressUnsafeMarkerV01,
  isCandidateIngressPublicSafeRefV01,
  uniqueCandidateIngressStringsV01,
} from "@/lib/intake/candidate-ingress-normalizer";
import {
  HANDOFF_PACKET_COPY_EXPORT_CONTRACT_DECISION_PREVIEW_VERSION,
  type HandoffPacketCopyExportContractOperatorDecisionPreview,
} from "@/types/handoff-packet-copy-export-contract-decision";
import { HANDOFF_PACKET_COPY_EXPORT_CONTRACT_PREVIEW_VERSION } from "@/types/handoff-packet-copy-export-contract-preview";
import {
  HANDOFF_PACKET_COPY_EXPORT_CONTRACT_RECEIPT_VERSION,
  HANDOFF_PACKET_COPY_EXPORT_CONTRACT_RECORD_VERSION,
  HANDOFF_PACKET_COPY_EXPORT_CONTRACT_STORE_VERSION,
  HANDOFF_PACKET_COPY_EXPORT_CONTRACT_WRITE_SCOPE,
  type HandoffPacketCopyExportContractAuthorityProfile,
  type HandoffPacketCopyExportContractNoCopyExportOrSend,
  type HandoffPacketCopyExportContractNoSideEffects,
  type HandoffPacketCopyExportContractRecord,
  type HandoffPacketCopyExportContractReceipt,
  type HandoffPacketCopyExportContractStoreResult,
  type HandoffPacketCopyExportContractWriteAuthorityBoundary,
  type HandoffPacketCopyExportContractWriteInput,
  type HandoffPacketCopyExportContractWriteStatus,
  type HandoffPacketCopyExportContractWriteValidation,
} from "@/types/handoff-packet-copy-export-contract-write";

export const HANDOFF_PACKET_COPY_EXPORT_CONTRACT_WRITE_TABLE =
  "handoff_packet_copy_export_contract_records" as const;

export interface HandoffPacketCopyExportContractWriteDbLike {
  exec(sql: string): unknown;
  prepare(sql: string): {
    run(...params: unknown[]): unknown;
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  };
}

export interface HandoffPacketCopyExportContractWriteListOptions {
  idempotency_key?: string;
  operator_ref?: string;
  packet_format?: string;
  copy_export_target?: string;
  limit?: number;
}

interface HandoffPacketCopyExportContractWriteRow {
  record_id: string;
  idempotency_key: string;
  created_at: string;
  scope: string;
  operator_ref: string;
  packet_format: string;
  copy_export_target: string;
  record_fingerprint: string;
  record_json: string;
  receipt_json: string;
}

interface ValidationResult {
  ok: boolean;
  refusal_reasons: string[];
  input: HandoffPacketCopyExportContractWriteInput | null;
  idempotency_key: string | null;
}

const allowedRequestedSideEffectKeys = new Set([
  "can_write_db",
  "can_create_handoff_packet_copy_export_contract_record",
  "can_create_handoff_packet_copy_export_contract_receipt",
  "handoff_packet_copy_export_contract_record_written",
  "handoff_packet_copy_export_contract_receipt_written",
  "handoff_packet_copy_export_contract_persisted",
  "handoff_packet_copy_export_contract_written",
]);

const forbiddenRequestedSideEffectPatterns = [
  /handoff.*(copy|export|send|live|mutate|selected.*refs)/i,
  /packet.*(copy|export|file|download|clipboard|send)/i,
  /clipboard|download|file.*write/i,
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

const readOnlyAuthorityFalseFields = [
  "can_write_db",
  "can_create_handoff_packet_copy_export_contract_record",
  "can_copy_export_handoff_packet",
  "can_write_handoff_packet_file",
  "can_write_clipboard",
  "can_download_file",
  "can_send_handoff",
  "can_mutate_handoff_context",
  "can_apply_handoff_context_update_live",
  "can_write_selected_refs_to_live_handoff",
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
  "can_create_handoff_packet_copy_export_contract_receipt",
] as const;

export const handoffPacketCopyExportContractWriteSchemaSqlV01 = `
CREATE TABLE IF NOT EXISTS handoff_packet_copy_export_contract_records (
  record_id TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  scope TEXT NOT NULL,
  operator_ref TEXT NOT NULL,
  packet_format TEXT NOT NULL,
  copy_export_target TEXT NOT NULL,
  record_fingerprint TEXT NOT NULL,
  record_json TEXT NOT NULL,
  receipt_json TEXT NOT NULL,
  UNIQUE(scope, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_handoff_packet_copy_export_contract_records_scope_created
  ON handoff_packet_copy_export_contract_records(scope, created_at, record_id);

CREATE INDEX IF NOT EXISTS idx_handoff_packet_copy_export_contract_records_operator
  ON handoff_packet_copy_export_contract_records(scope, operator_ref, created_at, record_id);

CREATE INDEX IF NOT EXISTS idx_handoff_packet_copy_export_contract_records_format_target
  ON handoff_packet_copy_export_contract_records(scope, packet_format, copy_export_target, created_at, record_id);
`;

export function ensureHandoffPacketCopyExportContractWriteSchemaV01(
  db: HandoffPacketCopyExportContractWriteDbLike,
): void {
  db.exec(handoffPacketCopyExportContractWriteSchemaSqlV01);
}

export function handoffPacketCopyExportContractWriteSchemaExistsV01(
  db: HandoffPacketCopyExportContractWriteDbLike,
): boolean {
  const row = db
    .prepare(
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name = ?`,
    )
    .get(HANDOFF_PACKET_COPY_EXPORT_CONTRACT_WRITE_TABLE) as
    | { name?: string }
    | undefined;
  return row?.name === HANDOFF_PACKET_COPY_EXPORT_CONTRACT_WRITE_TABLE;
}

export function validateHandoffPacketCopyExportContractWriteInputV01(
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
  const decisionPreview = getRecord(input, "operator_decision_preview");
  reasons.push(...validateDecisionPreview(decisionPreview));
  const decisionMaterial = getRecord(
    decisionPreview,
    "would_write_handoff_packet_copy_export_contract_decision_preview",
  );
  const contractPreview = getRecord(decisionMaterial, "contract_preview");
  const recordMaterial = getRecord(
    contractPreview,
    "would_write_handoff_packet_copy_export_contract_record_preview",
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
        ? (input as unknown as HandoffPacketCopyExportContractWriteInput)
        : null,
    idempotency_key: idempotencyKey,
  });
}

export function writeHandoffPacketCopyExportContractRecordV01(
  input: unknown,
  options: { db: HandoffPacketCopyExportContractWriteDbLike },
): HandoffPacketCopyExportContractStoreResult {
  const validation = validateHandoffPacketCopyExportContractWriteInputV01(input);
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

  ensureHandoffPacketCopyExportContractWriteSchemaV01(options.db);
  const record = buildRecord(
    validation as ValidationResult & {
      ok: true;
      input: HandoffPacketCopyExportContractWriteInput;
      idempotency_key: string;
    },
  );
  const existing = readHandoffPacketCopyExportContractRecordByIdempotencyKeyV01(
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
        `INSERT INTO handoff_packet_copy_export_contract_records (
          record_id,
          idempotency_key,
          created_at,
          scope,
          operator_ref,
          packet_format,
          copy_export_target,
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
        record.requested_packet_format,
        record.requested_copy_export_target,
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

export function refuseHandoffPacketCopyExportContractWriteV01(
  input: unknown,
  extraReasons: string[] = [],
): HandoffPacketCopyExportContractStoreResult {
  const validation = validateHandoffPacketCopyExportContractWriteInputV01(input);
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

export function readHandoffPacketCopyExportContractRecordByIdV01(
  recordId: string,
  options: { db: HandoffPacketCopyExportContractWriteDbLike },
): HandoffPacketCopyExportContractStoreResult {
  if (!handoffPacketCopyExportContractWriteSchemaExistsV01(options.db)) {
    return schemaMissingResult(null);
  }
  const row = options.db
    .prepare(
      `SELECT * FROM handoff_packet_copy_export_contract_records
       WHERE record_id = ? AND scope = ?`,
    )
    .get(recordId, HANDOFF_PACKET_COPY_EXPORT_CONTRACT_WRITE_SCOPE) as
    | HandoffPacketCopyExportContractWriteRow
    | undefined;
  if (!row) return notFoundResult(null);
  return rowStoreResult("read", row);
}

export function readHandoffPacketCopyExportContractRecordByIdempotencyKeyV01(
  idempotencyKey: string,
  options: { db: HandoffPacketCopyExportContractWriteDbLike },
): HandoffPacketCopyExportContractStoreResult {
  if (!handoffPacketCopyExportContractWriteSchemaExistsV01(options.db)) {
    return schemaMissingResult(idempotencyKey);
  }
  const row = options.db
    .prepare(
      `SELECT * FROM handoff_packet_copy_export_contract_records
       WHERE idempotency_key = ? AND scope = ?`,
    )
    .get(idempotencyKey, HANDOFF_PACKET_COPY_EXPORT_CONTRACT_WRITE_SCOPE) as
    | HandoffPacketCopyExportContractWriteRow
    | undefined;
  if (!row) return notFoundResult(idempotencyKey);
  return rowStoreResult("read", row);
}

export function listHandoffPacketCopyExportContractRecordsV01(
  options: { db: HandoffPacketCopyExportContractWriteDbLike } &
    HandoffPacketCopyExportContractWriteListOptions,
): HandoffPacketCopyExportContractStoreResult {
  if (!handoffPacketCopyExportContractWriteSchemaExistsV01(options.db)) {
    return schemaMissingResult(options.idempotency_key ?? null);
  }
  const clauses = ["scope = ?"];
  const params: unknown[] = [HANDOFF_PACKET_COPY_EXPORT_CONTRACT_WRITE_SCOPE];
  if (options.idempotency_key) {
    clauses.push("idempotency_key = ?");
    params.push(options.idempotency_key);
  }
  if (options.operator_ref) {
    clauses.push("operator_ref = ?");
    params.push(options.operator_ref);
  }
  if (options.packet_format) {
    clauses.push("packet_format = ?");
    params.push(options.packet_format);
  }
  if (options.copy_export_target) {
    clauses.push("copy_export_target = ?");
    params.push(options.copy_export_target);
  }
  const limit = Math.max(1, Math.min(options.limit ?? 50, 100));
  const rows = options.db
    .prepare(
      `SELECT * FROM handoff_packet_copy_export_contract_records
       WHERE ${clauses.join(" AND ")}
       ORDER BY created_at DESC, record_id DESC
       LIMIT ?`,
    )
    .all(...params, limit) as HandoffPacketCopyExportContractWriteRow[];
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

export function createHandoffPacketCopyExportContractWriteAuthorityBoundaryV01({
  writeNow,
}: {
  writeNow: boolean;
}): HandoffPacketCopyExportContractWriteAuthorityBoundary {
  return {
    durable_local_handoff_packet_copy_export_contract: true,
    source_of_truth: false,
    local_project_handoff_packet_copy_export_contract_only: true,
    can_write_db: writeNow,
    can_create_handoff_packet_copy_export_contract_record: writeNow,
    can_create_handoff_packet_copy_export_contract_receipt: writeNow,
    can_copy_export_handoff_packet: false,
    can_write_handoff_packet_file: false,
    can_write_clipboard: false,
    can_download_file: false,
    can_send_handoff: false,
    can_mutate_handoff_context: false,
    can_apply_handoff_context_update_live: false,
    can_write_selected_refs_to_live_handoff: false,
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
      "Authority is limited to a scoped local Handoff Packet Copy/Export contract record and receipt.",
      "This writer cannot copy, export, download, write packet files, write clipboard, send handoff, mutate handoff context, write selected refs, route state, scoped CWP/Perspective/Relay records, memory, metrics, or external systems.",
    ],
  };
}

function validateDecisionPreview(preview: Record<string, unknown> | null): string[] {
  if (!preview) return ["operator_decision_preview_missing"];
  const reasons: string[] = [];
  if (
    preview.preview_version !==
    HANDOFF_PACKET_COPY_EXPORT_CONTRACT_DECISION_PREVIEW_VERSION
  ) {
    reasons.push("operator_decision_preview_version_invalid");
  }
  if (preview.scope !== HANDOFF_PACKET_COPY_EXPORT_CONTRACT_WRITE_SCOPE) {
    reasons.push("operator_decision_preview_scope_invalid");
  }
  if (
    preview.decision_preview_status !==
    "ready_for_future_handoff_packet_copy_export_contract_record_write"
  ) {
    reasons.push("operator_decision_preview_not_ready_for_handoff_packet_copy_export_contract_record_write");
  }
  if (
    preview.recommended_operator_decision !==
    "approve_for_handoff_packet_copy_export_contract_record"
  ) {
    reasons.push("operator_decision_preview_recommended_decision_not_approve");
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
    reasons.push("operator_decision_preview_write_readiness_invalid");
  }
  const decisionMaterial = getRecord(
    preview,
    "would_write_handoff_packet_copy_export_contract_decision_preview",
  );
  if (!decisionMaterial) {
    reasons.push("operator_decision_preview_write_material_missing");
  } else {
    reasons.push(...validateContractPreview(getRecord(decisionMaterial, "contract_preview")));
  }
  const authority = getRecord(preview, "authority_boundary");
  if (!authority || !hasReadOnlyDecisionAuthority(authority)) {
    reasons.push("operator_decision_preview_authority_boundary_invalid");
  }
  return reasons;
}

function validateContractPreview(preview: Record<string, unknown> | null): string[] {
  if (!preview) return ["handoff_packet_copy_export_contract_preview_missing"];
  const reasons: string[] = [];
  if (preview.preview_version !== HANDOFF_PACKET_COPY_EXPORT_CONTRACT_PREVIEW_VERSION) {
    reasons.push("handoff_packet_copy_export_contract_preview_version_invalid");
  }
  if (
    preview.contract_preview_status !==
    "ready_for_future_handoff_packet_copy_export_contract_record_write"
  ) {
    reasons.push("handoff_packet_copy_export_contract_preview_not_ready");
  }
  const readiness = getRecord(preview, "contract_readiness");
  if (!readiness || readiness.write_ready !== true) {
    reasons.push("handoff_packet_copy_export_contract_preview_readiness_invalid");
  }
  const recordMaterial = getRecord(
    preview,
    "would_write_handoff_packet_copy_export_contract_record_preview",
  );
  if (!recordMaterial) {
    reasons.push("handoff_packet_copy_export_contract_record_material_missing");
  } else {
    reasons.push(...validateRecordMaterial(recordMaterial));
  }
  const authority = getRecord(preview, "authority_boundary");
  if (!authority || !hasReadOnlyContractPreviewAuthority(authority)) {
    reasons.push("handoff_packet_copy_export_contract_preview_authority_boundary_invalid");
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
  if (
    approval.operator_decision !==
    "approve_for_handoff_packet_copy_export_contract_record"
  ) {
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
  if (material.record_version !== HANDOFF_PACKET_COPY_EXPORT_CONTRACT_RECORD_VERSION) {
    reasons.push("handoff_packet_copy_export_contract_record_version_invalid");
  }
  if (material.scope !== HANDOFF_PACKET_COPY_EXPORT_CONTRACT_WRITE_SCOPE) {
    reasons.push("handoff_packet_copy_export_contract_record_scope_invalid");
  }
  for (const key of [
    "requested_operator_ref",
    "requested_idempotency_key",
    "review_confirmation_ref",
    "source_applied_handoff_context_snapshot_ref",
  ]) {
    if (!safeRef(material[key])) reasons.push(`${key}_missing_or_invalid`);
  }
  for (const key of ["source_refs", "evidence_refs"]) {
    const refs = Array.isArray(material[key]) ? material[key] : [];
    if (!refs.length || !refs.every(safeRef)) reasons.push(`${key}_missing_or_invalid`);
  }
  const contract = getRecord(
    material,
    "proposed_handoff_packet_copy_export_contract",
  );
  if (!isContractMaterialLike(contract)) {
    reasons.push("handoff_packet_copy_export_contract_material_malformed");
  }
  const manifest = getRecord(material, "proposed_packet_manifest");
  if (!isPacketManifestLike(manifest)) {
    reasons.push("handoff_packet_manifest_malformed");
  }
  const entries = Array.isArray(material.proposed_packet_entries)
    ? material.proposed_packet_entries
    : [];
  if (!entries.length || !entries.every(isPacketEntryLike)) {
    reasons.push("handoff_packet_entries_malformed");
  }
  const plan = getRecord(material, "proposed_copy_export_plan");
  if (!isCopyExportPlanLike(plan)) {
    reasons.push("handoff_packet_copy_export_plan_malformed");
  }
  return reasons;
}

function buildRecord(
  validation: ValidationResult & {
    ok: true;
    input: HandoffPacketCopyExportContractWriteInput;
    idempotency_key: string;
  },
): HandoffPacketCopyExportContractRecord {
  const decisionPreview = validation.input.operator_decision_preview;
  const decisionMaterial =
    decisionPreview.would_write_handoff_packet_copy_export_contract_decision_preview;
  const contractPreview = decisionMaterial.contract_preview;
  if (!contractPreview) {
    throw new Error("validated copy/export contract material missing preview");
  }
  const material =
    contractPreview.would_write_handoff_packet_copy_export_contract_record_preview;
  const createdAt =
    validation.input.operator_approval.approved_at || new Date().toISOString();
  const recordBase = {
    record_version: HANDOFF_PACKET_COPY_EXPORT_CONTRACT_RECORD_VERSION,
    idempotency_key: validation.idempotency_key,
    created_at: createdAt,
    scope: HANDOFF_PACKET_COPY_EXPORT_CONTRACT_WRITE_SCOPE,
    operator_ref: validation.input.operator_approval.operator_ref,
    source_refs: material.source_refs,
    evidence_refs: material.evidence_refs,
    source_applied_handoff_context_snapshot_ref:
      material.source_applied_handoff_context_snapshot_ref ?? "",
    source_handoff_context_apply_record_ref:
      material.source_handoff_context_apply_record_ref,
    source_handoff_context_update_contract_record_ref:
      material.source_handoff_context_update_contract_record_ref,
    source_route_integration_read_ref: material.source_route_integration_read_ref,
    source_runtime_current_working_perspective_ref:
      material.source_runtime_current_working_perspective_ref,
    source_applied_cwp_snapshot_ref: material.source_applied_cwp_snapshot_ref,
    requested_packet_format: material.requested_packet_format ?? "operator_handoff_packet_markdown",
    requested_copy_export_target:
      material.requested_copy_export_target ?? "operator_copy_surface_candidate",
    proposed_handoff_packet_copy_export_contract:
      material.proposed_handoff_packet_copy_export_contract!,
    proposed_packet_manifest: material.proposed_packet_manifest!,
    proposed_packet_entries: material.proposed_packet_entries,
    proposed_packet_entry_count: material.proposed_packet_entries.length,
    proposed_packet_section_counts: material.proposed_packet_section_counts,
    proposed_copy_export_plan: material.proposed_copy_export_plan,
    authority_profile: createAuthorityProfile(),
    review_status: "recorded_as_scoped_handoff_packet_copy_export_contract" as const,
    persistence_horizon:
      "local_project_handoff_packet_copy_export_contract_store" as const,
    no_copy_export_or_send_performed: createNoCopyExportOrSend(),
    write_validation: createWriteValidation({
      decisionPreview,
      material,
    }),
    authority_boundary:
      createHandoffPacketCopyExportContractWriteAuthorityBoundaryV01({
        writeNow: true,
      }),
    notes: publicSafeRefs(validation.input.notes ?? []),
  };
  const recordFingerprint = fingerprint(recordBase);
  return {
    ...recordBase,
    record_id: `handoff-packet-copy-export-contract:${recordFingerprint.slice(0, 24)}`,
    record_fingerprint: recordFingerprint,
  };
}

function createAuthorityProfile(): HandoffPacketCopyExportContractAuthorityProfile {
  return {
    durable_local_handoff_packet_copy_export_contract: true,
    source_of_truth: false,
    local_project_handoff_packet_copy_export_contract_only: true,
    persistence_horizon: "local_project_handoff_packet_copy_export_contract_store",
    handoff_packet_copy_export_contract_written: true,
    handoff_packet_copied: false,
    handoff_packet_exported: false,
    handoff_packet_file_written: false,
    clipboard_written: false,
    handoff_sent: false,
    live_handoff_context_mutated: false,
    selected_refs_written_to_live_handoff: false,
    handoff_context_apply_record_written: false,
    applied_handoff_context_snapshot_written: false,
    handoff_context_update_contract_record_written: false,
    api_perspective_current_route_modified: false,
    upstream_current_working_perspective_source_tables_mutated: false,
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
}: {
  decisionPreview: HandoffPacketCopyExportContractOperatorDecisionPreview;
  material: unknown;
}): HandoffPacketCopyExportContractWriteValidation {
  return {
    validation_version: "handoff_packet_copy_export_contract_write_validation.v0.1",
    operator_decision_preview_revalidated: true,
    handoff_packet_copy_export_contract_revalidated: true,
    packet_manifest_revalidated: true,
    packet_entries_revalidated: true,
    refused_sample_fixture_default_or_smoke_material: false,
    refused_unrequested_side_effects: false,
    refused_packet_copy_export_or_send: false,
    refused_metric_or_upstream_write: false,
    validation_hash: fingerprint({
      decision_preview_version: decisionPreview.preview_version,
      material,
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
  record: HandoffPacketCopyExportContractRecord | null;
}): HandoffPacketCopyExportContractReceipt {
  return {
    receipt_version: HANDOFF_PACKET_COPY_EXPORT_CONTRACT_RECEIPT_VERSION,
    record_id: record?.record_id ?? null,
    idempotency_key: validation.idempotency_key,
    wrote,
    idempotent_replay: idempotentReplay,
    created_at: new Date().toISOString(),
    refused,
    refusal_reasons: validation.refusal_reasons,
    validation_hash: record?.write_validation.validation_hash ?? null,
    record_fingerprint: record?.record_fingerprint ?? null,
    store_ref: record ? "handoff_packet_copy_export_contract_store.v0.1" : null,
    source_refs: record?.source_refs ?? [],
    no_side_effects: createNoSideEffects(wrote),
  };
}

function storeResult(
  status: HandoffPacketCopyExportContractWriteStatus,
  record: HandoffPacketCopyExportContractRecord | null,
  records: HandoffPacketCopyExportContractRecord[],
  receipt: HandoffPacketCopyExportContractReceipt,
): HandoffPacketCopyExportContractStoreResult {
  return {
    store_version: HANDOFF_PACKET_COPY_EXPORT_CONTRACT_STORE_VERSION,
    scope: HANDOFF_PACKET_COPY_EXPORT_CONTRACT_WRITE_SCOPE,
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
      status === "refused" || status === "not_found" || status === "schema_missing"
        ? status
        : null,
    no_side_effects: receipt.no_side_effects,
  };
}

function rowStoreResult(
  status: HandoffPacketCopyExportContractWriteStatus,
  row: HandoffPacketCopyExportContractWriteRow,
): HandoffPacketCopyExportContractStoreResult {
  const record = rowToRecord(row);
  return storeResult(status, record, [record], rowToReceipt(row));
}

function schemaMissingResult(
  idempotencyKey: string | null,
): HandoffPacketCopyExportContractStoreResult {
  return storeResult(
    "schema_missing",
    null,
    [],
    createRefusedReceipt(["schema_missing"], idempotencyKey),
  );
}

function notFoundResult(
  idempotencyKey: string | null,
): HandoffPacketCopyExportContractStoreResult {
  return storeResult(
    "not_found",
    null,
    [],
    createRefusedReceipt(["record_not_found"], idempotencyKey),
  );
}

function createRefusedReceipt(
  refusalReasons: string[],
  idempotencyKey: string | null,
): HandoffPacketCopyExportContractReceipt {
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

function createNoSideEffects(
  wrote: boolean,
): HandoffPacketCopyExportContractNoSideEffects {
  return {
    handoff_packet_copy_export_contract_record_written: wrote,
    handoff_packet_copy_export_contract_receipt_written: wrote,
    handoff_packet_copy_export_contract_persisted: wrote,
    handoff_packet_copy_export_contract_written: wrote,
    ...createNoCopyExportOrSend(),
  };
}

function createNoCopyExportOrSend():
  HandoffPacketCopyExportContractNoCopyExportOrSend {
  return {
    handoff_packet_copied: false,
    handoff_packet_exported: false,
    handoff_packet_file_written: false,
    clipboard_written: false,
    file_download_created: false,
    handoff_sent: false,
    live_handoff_context_updated: false,
    live_handoff_context_mutated: false,
    handoff_context_applied_live: false,
    handoff_context_mutated: false,
    selected_refs_written_to_live_handoff: false,
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

function isContractMaterialLike(value: Record<string, unknown> | null): boolean {
  return Boolean(
    value &&
      value.contract_kind === "handoff_packet_copy_export_contract.v0.1" &&
      value.packet_family === "augnes_operator_handoff_packet" &&
      safeRef(value.source_applied_handoff_context_snapshot_ref) &&
      typeof value.requested_packet_format === "string" &&
      typeof value.requested_copy_export_target === "string" &&
      isPacketManifestLike(getRecord(value, "proposed_packet_manifest")) &&
      Array.isArray(value.proposed_packet_entries) &&
      value.proposed_packet_entries.length > 0 &&
      value.proposed_packet_entries.every(isPacketEntryLike) &&
      isCopyExportPlanLike(getRecord(value, "proposed_copy_export_plan")) &&
      Array.isArray(value.required_source_refs) &&
      value.required_source_refs.every(safeRef) &&
      Array.isArray(value.required_evidence_refs) &&
      value.required_evidence_refs.every(safeRef),
  );
}

function isPacketManifestLike(value: Record<string, unknown> | null): boolean {
  return Boolean(
    value &&
      value.manifest_version === "handoff_packet_manifest.v0.1" &&
      safeRef(value.packet_ref) &&
      typeof value.packet_title === "string" &&
      typeof value.packet_format === "string" &&
      typeof value.packet_target === "string" &&
      safeRef(value.source_applied_handoff_context_snapshot_ref) &&
      typeof value.entry_count === "number" &&
      value.entry_count > 0 &&
      typeof value.section_count === "number" &&
      value.section_count > 0 &&
      value.public_safe === true &&
      value.raw_private_material_excluded === true &&
      value.copy_export_not_performed === true &&
      value.send_not_performed === true,
  );
}

function isPacketEntryLike(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    safeRef(value.packet_entry_ref) &&
    typeof value.packet_section === "string" &&
    typeof value.entry_kind === "string" &&
    typeof value.copy_export_rendering_hint === "string" &&
    typeof value.summary === "string" &&
    Array.isArray(value.source_refs) &&
    value.source_refs.every(safeRef) &&
    Array.isArray(value.evidence_refs) &&
    value.evidence_refs.every(safeRef) &&
    value.public_safe === true &&
    value.raw_private_material_excluded === true &&
    value.authority_required === "future_handoff_packet_copy_export" &&
    value.persistence_horizon === "handoff_packet_copy_export_contract_record"
  );
}

function isCopyExportPlanLike(value: Record<string, unknown> | null): boolean {
  return Boolean(
    value &&
      value.plan_version === "handoff_packet_copy_export_plan.v0.1" &&
      typeof value.packet_entry_count === "number" &&
      value.packet_entry_count > 0 &&
      isRecord(value.packet_section_counts) &&
      safeRef(value.source_applied_handoff_context_snapshot_ref) &&
      value.copy_export_not_performed === true &&
      value.clipboard_write_not_performed === true &&
      value.file_write_not_performed === true &&
      value.download_not_performed === true &&
      value.handoff_send_not_performed === true,
  );
}

function hasReadOnlyContractPreviewAuthority(
  authority: Record<string, unknown> | null,
): boolean {
  return Boolean(
    authority &&
      authority.read_only === true &&
      authority.advisory_only === true &&
      authority.contract_material_only === true &&
      authority.source_of_truth === false &&
      fieldsFalse(authority, readOnlyAuthorityFalseFields) &&
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
      fieldsFalse(authority, readOnlyAuthorityFalseFields) &&
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
  input: HandoffPacketCopyExportContractWriteInput | null;
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

function rowToRecord(
  row: HandoffPacketCopyExportContractWriteRow,
): HandoffPacketCopyExportContractRecord {
  return JSON.parse(row.record_json) as HandoffPacketCopyExportContractRecord;
}

function rowToReceipt(
  row: HandoffPacketCopyExportContractWriteRow,
): HandoffPacketCopyExportContractReceipt {
  return JSON.parse(row.receipt_json) as HandoffPacketCopyExportContractReceipt;
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
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
