import { createHash } from "node:crypto";

import {
  containsCandidateIngressUnsafeMarkerV01,
  isCandidateIngressPublicSafeRefV01,
  uniqueCandidateIngressStringsV01,
} from "@/lib/intake/candidate-ingress-normalizer";
import {
  calculateHandoffPacketExportedArtifactPayloadHashV01,
} from "@/lib/workplane/handoff-packet-copy-export-preview";
import {
  HANDOFF_PACKET_COPY_EXPORT_DECISION_PREVIEW_VERSION,
  type HandoffPacketCopyExportOperatorDecisionPreview,
} from "@/types/handoff-packet-copy-export-decision";
import {
  HANDOFF_PACKET_COPY_EXPORT_PREVIEW_VERSION,
  HANDOFF_PACKET_EXPORTED_ARTIFACT_VERSION,
  type HandoffPacketExportedArtifact,
} from "@/types/handoff-packet-copy-export-preview";
import {
  HANDOFF_PACKET_COPY_EXPORT_RECEIPT_VERSION,
  HANDOFF_PACKET_COPY_EXPORT_RECORD_VERSION,
  HANDOFF_PACKET_COPY_EXPORT_STORE_VERSION,
  HANDOFF_PACKET_COPY_EXPORT_WRITE_SCOPE,
  type HandoffPacketCopyExportAuthorityProfile,
  type HandoffPacketCopyExportNoExternalCopyExportOrSend,
  type HandoffPacketCopyExportNoSideEffects,
  type HandoffPacketCopyExportReceipt,
  type HandoffPacketCopyExportRecord,
  type HandoffPacketCopyExportStoreResult,
  type HandoffPacketCopyExportWriteAuthorityBoundary,
  type HandoffPacketCopyExportWriteInput,
  type HandoffPacketCopyExportWriteStatus,
  type HandoffPacketCopyExportWriteValidation,
} from "@/types/handoff-packet-copy-export-write";

export const HANDOFF_PACKET_COPY_EXPORT_WRITE_TABLE =
  "handoff_packet_copy_export_records" as const;

export interface HandoffPacketCopyExportWriteDbLike {
  exec(sql: string): unknown;
  prepare(sql: string): {
    run(...params: unknown[]): unknown;
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  };
}

export interface HandoffPacketCopyExportWriteListOptions {
  idempotency_key?: string;
  operator_ref?: string;
  exported_artifact_ref?: string;
  packet_format?: string;
  copy_export_target?: string;
  limit?: number;
}

interface HandoffPacketCopyExportWriteRow {
  record_id: string;
  idempotency_key: string;
  created_at: string;
  scope: string;
  operator_ref: string;
  packet_format: string;
  copy_export_target: string;
  exported_artifact_ref: string;
  record_fingerprint: string;
  artifact_hash: string;
  record_json: string;
  exported_artifact_json: string;
  receipt_json: string;
}

interface ValidationResult {
  ok: boolean;
  refusal_reasons: string[];
  input: HandoffPacketCopyExportWriteInput | null;
  idempotency_key: string | null;
}

const allowedRequestedSideEffectKeys = new Set([
  "can_write_db",
  "can_create_handoff_packet_copy_export_record",
  "can_create_handoff_packet_copy_export_receipt",
  "can_create_handoff_packet_exported_artifact",
  "can_persist_local_packet_artifact",
  "handoff_packet_copy_export_record_written",
  "handoff_packet_copy_export_receipt_written",
  "handoff_packet_copy_export_persisted",
  "handoff_packet_exported_artifact_written",
  "handoff_packet_materialized_to_local_artifact",
]);

const forbiddenRequestedSideEffectPatterns = [
  /clipboard|download|arbitrary.*file|packet.*file/i,
  /handoff.*(send|live|mutate|selected.*refs)/i,
  /packet.*(clipboard|download|file|send|external)/i,
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
  "can_create_handoff_packet_copy_export_record",
  "can_create_handoff_packet_copy_export_receipt",
  "can_create_handoff_packet_exported_artifact",
  "can_persist_local_packet_artifact",
  "can_copy_export_handoff_packet_to_local_artifact",
  "can_write_handoff_packet_file",
  "can_write_clipboard",
  "can_download_file",
  "can_send_handoff",
  "can_mutate_handoff_context",
  "can_apply_handoff_context_update_live",
  "can_write_selected_refs_to_live_handoff",
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

const writeAuthorityTrueFields = [
  "durable_local_handoff_packet_copy_export_record",
  "durable_local_handoff_packet_exported_artifact",
  "local_project_handoff_packet_copy_export_only",
  "can_write_db",
  "can_create_handoff_packet_copy_export_record",
  "can_create_handoff_packet_copy_export_receipt",
  "can_create_handoff_packet_exported_artifact",
  "can_persist_local_packet_artifact",
  "can_materialize_handoff_packet_to_local_artifact",
] as const;

const writeAuthorityFalseFields = [
  "source_of_truth",
  "can_write_clipboard",
  "can_download_file",
  "can_write_arbitrary_file",
  "can_write_handoff_packet_file",
  "can_send_handoff",
  "can_mutate_handoff_context",
  "can_apply_handoff_context_update_live",
  "can_write_selected_refs_to_live_handoff",
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

export const handoffPacketCopyExportWriteSchemaSqlV01 = `
CREATE TABLE IF NOT EXISTS handoff_packet_copy_export_records (
  record_id TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  scope TEXT NOT NULL,
  operator_ref TEXT NOT NULL,
  packet_format TEXT NOT NULL,
  copy_export_target TEXT NOT NULL,
  exported_artifact_ref TEXT NOT NULL,
  record_fingerprint TEXT NOT NULL,
  artifact_hash TEXT NOT NULL,
  record_json TEXT NOT NULL,
  exported_artifact_json TEXT NOT NULL,
  receipt_json TEXT NOT NULL,
  UNIQUE(scope, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_handoff_packet_copy_export_records_scope_created
  ON handoff_packet_copy_export_records(scope, created_at, record_id);

CREATE INDEX IF NOT EXISTS idx_handoff_packet_copy_export_records_operator
  ON handoff_packet_copy_export_records(scope, operator_ref, created_at, record_id);

CREATE INDEX IF NOT EXISTS idx_handoff_packet_copy_export_records_artifact
  ON handoff_packet_copy_export_records(scope, exported_artifact_ref, created_at, record_id);

CREATE INDEX IF NOT EXISTS idx_handoff_packet_copy_export_records_format_target
  ON handoff_packet_copy_export_records(scope, packet_format, copy_export_target, created_at, record_id);
`;

export function ensureHandoffPacketCopyExportWriteSchemaV01(
  db: HandoffPacketCopyExportWriteDbLike,
): void {
  db.exec(handoffPacketCopyExportWriteSchemaSqlV01);
}

export function handoffPacketCopyExportWriteSchemaExistsV01(
  db: HandoffPacketCopyExportWriteDbLike,
): boolean {
  const row = db
    .prepare(
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name = ?`,
    )
    .get(HANDOFF_PACKET_COPY_EXPORT_WRITE_TABLE) as
    | { name?: string }
    | undefined;
  return row?.name === HANDOFF_PACKET_COPY_EXPORT_WRITE_TABLE;
}

export function validateHandoffPacketCopyExportWriteInputV01(
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
  const decisionPreview = getRecord(input, "copy_export_decision_preview");
  reasons.push(...validateDecisionPreview(decisionPreview));
  const decisionMaterial = getRecord(
    decisionPreview,
    "would_write_handoff_packet_copy_export_decision_preview",
  );
  const preview = getRecord(decisionMaterial, "copy_export_preview");
  const recordMaterial = getRecord(
    preview,
    "would_write_handoff_packet_copy_export_record_preview",
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
        ? (input as unknown as HandoffPacketCopyExportWriteInput)
        : null,
    idempotency_key: idempotencyKey,
  });
}

export function writeHandoffPacketCopyExportRecordV01(
  input: unknown,
  options: { db: HandoffPacketCopyExportWriteDbLike },
): HandoffPacketCopyExportStoreResult {
  const validation = validateHandoffPacketCopyExportWriteInputV01(input);
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

  ensureHandoffPacketCopyExportWriteSchemaV01(options.db);
  const record = buildRecord(
    validation as ValidationResult & {
      ok: true;
      input: HandoffPacketCopyExportWriteInput;
      idempotency_key: string;
    },
  );
  const existing = readHandoffPacketCopyExportRecordByIdempotencyKeyV01(
    record.idempotency_key,
    { db: options.db },
  ).record;
  if (existing) {
    if (existing.record_fingerprint === record.record_fingerprint) {
      return storeResult(
        "idempotent_existing",
        existing,
        [existing],
        existing.exported_packet_artifact,
        [existing.exported_packet_artifact],
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
      existing.exported_packet_artifact,
      [existing.exported_packet_artifact],
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
        `INSERT INTO handoff_packet_copy_export_records (
          record_id,
          idempotency_key,
          created_at,
          scope,
          operator_ref,
          packet_format,
          copy_export_target,
          exported_artifact_ref,
          record_fingerprint,
          artifact_hash,
          record_json,
          exported_artifact_json,
          receipt_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        record.record_id,
        record.idempotency_key,
        record.created_at,
        record.scope,
        validation.input.operator_approval.operator_ref,
        record.requested_packet_format,
        record.requested_copy_export_target,
        record.exported_artifact_ref,
        record.record_fingerprint,
        record.exported_packet_artifact_hash,
        JSON.stringify(record),
        JSON.stringify(record.exported_packet_artifact),
        JSON.stringify(receipt),
      );
    options.db.prepare("COMMIT").run();
    transactionStarted = false;
    return storeResult(
      "written",
      record,
      [record],
      record.exported_packet_artifact,
      [record.exported_packet_artifact],
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

export function refuseHandoffPacketCopyExportWriteV01(
  input: unknown,
  extraReasons: string[] = [],
): HandoffPacketCopyExportStoreResult {
  const validation = validateHandoffPacketCopyExportWriteInputV01(input);
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

export function readHandoffPacketCopyExportRecordByIdV01(
  recordId: string,
  options: { db: HandoffPacketCopyExportWriteDbLike },
): HandoffPacketCopyExportStoreResult {
  if (!handoffPacketCopyExportWriteSchemaExistsV01(options.db)) {
    return schemaMissingResult(null);
  }
  const row = options.db
    .prepare(
      `SELECT * FROM handoff_packet_copy_export_records
       WHERE record_id = ? AND scope = ?`,
    )
    .get(recordId, HANDOFF_PACKET_COPY_EXPORT_WRITE_SCOPE) as
    | HandoffPacketCopyExportWriteRow
    | undefined;
  if (!row) return notFoundResult(null);
  return rowStoreResult("read", row);
}

export function readHandoffPacketCopyExportRecordByIdempotencyKeyV01(
  idempotencyKey: string,
  options: { db: HandoffPacketCopyExportWriteDbLike },
): HandoffPacketCopyExportStoreResult {
  if (!handoffPacketCopyExportWriteSchemaExistsV01(options.db)) {
    return schemaMissingResult(idempotencyKey);
  }
  const row = options.db
    .prepare(
      `SELECT * FROM handoff_packet_copy_export_records
       WHERE idempotency_key = ? AND scope = ?`,
    )
    .get(idempotencyKey, HANDOFF_PACKET_COPY_EXPORT_WRITE_SCOPE) as
    | HandoffPacketCopyExportWriteRow
    | undefined;
  if (!row) return notFoundResult(idempotencyKey);
  return rowStoreResult("read", row);
}

export function readHandoffPacketCopyExportRecordByExportedArtifactRefV01(
  exportedArtifactRef: string,
  options: { db: HandoffPacketCopyExportWriteDbLike },
): HandoffPacketCopyExportStoreResult {
  if (!handoffPacketCopyExportWriteSchemaExistsV01(options.db)) {
    return schemaMissingResult(null);
  }
  const row = options.db
    .prepare(
      `SELECT * FROM handoff_packet_copy_export_records
       WHERE exported_artifact_ref = ? AND scope = ?
       ORDER BY created_at DESC, record_id DESC
       LIMIT 1`,
    )
    .get(exportedArtifactRef, HANDOFF_PACKET_COPY_EXPORT_WRITE_SCOPE) as
    | HandoffPacketCopyExportWriteRow
    | undefined;
  if (!row) return notFoundResult(null);
  return rowStoreResult("read", row);
}

export function readLatestExportedHandoffPacketArtifactV01(
  options: { db: HandoffPacketCopyExportWriteDbLike },
): HandoffPacketCopyExportStoreResult {
  if (!handoffPacketCopyExportWriteSchemaExistsV01(options.db)) {
    return schemaMissingResult(null);
  }
  const row = options.db
    .prepare(
      `SELECT * FROM handoff_packet_copy_export_records
       WHERE scope = ?
       ORDER BY created_at DESC, record_id DESC
       LIMIT 1`,
    )
    .get(HANDOFF_PACKET_COPY_EXPORT_WRITE_SCOPE) as
    | HandoffPacketCopyExportWriteRow
    | undefined;
  if (!row) return notFoundResult(null);
  return rowStoreResult("read", row);
}

export function listHandoffPacketCopyExportRecordsV01(
  options: { db: HandoffPacketCopyExportWriteDbLike } &
    HandoffPacketCopyExportWriteListOptions,
): HandoffPacketCopyExportStoreResult {
  if (!handoffPacketCopyExportWriteSchemaExistsV01(options.db)) {
    return schemaMissingResult(options.idempotency_key ?? null);
  }
  const clauses = ["scope = ?"];
  const params: unknown[] = [HANDOFF_PACKET_COPY_EXPORT_WRITE_SCOPE];
  if (options.idempotency_key) {
    clauses.push("idempotency_key = ?");
    params.push(options.idempotency_key);
  }
  if (options.operator_ref) {
    clauses.push("operator_ref = ?");
    params.push(options.operator_ref);
  }
  if (options.exported_artifact_ref) {
    clauses.push("exported_artifact_ref = ?");
    params.push(options.exported_artifact_ref);
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
      `SELECT * FROM handoff_packet_copy_export_records
       WHERE ${clauses.join(" AND ")}
       ORDER BY created_at DESC, record_id DESC
       LIMIT ?`,
    )
    .all(...params, limit) as HandoffPacketCopyExportWriteRow[];
  const records = rows.map(rowToRecord);
  const artifacts = rows.map(rowToArtifact);
  return storeResult(
    "listed",
    records[0] ?? null,
    records,
    artifacts[0] ?? null,
    artifacts,
    rows[0]?.receipt_json
      ? rowToReceipt(rows[0])
      : createRefusedReceipt([], options.idempotency_key ?? null),
  );
}

export function createHandoffPacketCopyExportWriteAuthorityBoundaryV01({
  writeNow,
}: {
  writeNow: boolean;
}): HandoffPacketCopyExportWriteAuthorityBoundary {
  return {
    durable_local_handoff_packet_copy_export_record: true,
    durable_local_handoff_packet_exported_artifact: true,
    source_of_truth: false,
    local_project_handoff_packet_copy_export_only: true,
    can_write_db: writeNow,
    can_create_handoff_packet_copy_export_record: writeNow,
    can_create_handoff_packet_copy_export_receipt: writeNow,
    can_create_handoff_packet_exported_artifact: writeNow,
    can_persist_local_packet_artifact: writeNow,
    can_materialize_handoff_packet_to_local_artifact: writeNow,
    can_write_clipboard: false,
    can_download_file: false,
    can_write_arbitrary_file: false,
    can_write_handoff_packet_file: false,
    can_send_handoff: false,
    can_mutate_handoff_context: false,
    can_apply_handoff_context_update_live: false,
    can_write_selected_refs_to_live_handoff: false,
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
      "Authority is limited to a scoped local packet copy/export record, receipt, and exported artifact row.",
      "This writer cannot write clipboard, create downloads, write arbitrary files, send handoff, mutate handoff context, route state, CWP/Perspective/Relay records, memory, metrics, or external systems.",
    ],
  };
}

function validateDecisionPreview(preview: Record<string, unknown> | null): string[] {
  if (!preview) return ["copy_export_decision_preview_missing"];
  const reasons: string[] = [];
  if (preview.preview_version !== HANDOFF_PACKET_COPY_EXPORT_DECISION_PREVIEW_VERSION) {
    reasons.push("copy_export_decision_preview_version_invalid");
  }
  if (preview.scope !== HANDOFF_PACKET_COPY_EXPORT_WRITE_SCOPE) {
    reasons.push("copy_export_decision_preview_scope_invalid");
  }
  if (
    preview.decision_preview_status !==
    "ready_for_future_handoff_packet_copy_export_record_write"
  ) {
    reasons.push("copy_export_decision_preview_not_ready_for_handoff_packet_copy_export_record_write");
  }
  if (
    preview.recommended_operator_decision !==
    "approve_for_handoff_packet_copy_export_record"
  ) {
    reasons.push("copy_export_decision_preview_recommended_decision_not_approve");
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
    reasons.push("copy_export_decision_preview_write_readiness_invalid");
  }
  const decisionMaterial = getRecord(
    preview,
    "would_write_handoff_packet_copy_export_decision_preview",
  );
  if (!decisionMaterial) {
    reasons.push("copy_export_decision_preview_write_material_missing");
  } else {
    reasons.push(...validateCopyExportPreview(getRecord(decisionMaterial, "copy_export_preview")));
  }
  const authority = getRecord(preview, "authority_boundary");
  if (!authority || !hasReadOnlyDecisionAuthority(authority)) {
    reasons.push("copy_export_decision_preview_authority_boundary_invalid");
  }
  return reasons;
}

function validateCopyExportPreview(preview: Record<string, unknown> | null): string[] {
  if (!preview) return ["handoff_packet_copy_export_preview_missing"];
  const reasons: string[] = [];
  if (preview.preview_version !== HANDOFF_PACKET_COPY_EXPORT_PREVIEW_VERSION) {
    reasons.push("handoff_packet_copy_export_preview_version_invalid");
  }
  if (
    preview.copy_export_preview_status !==
    "ready_for_future_handoff_packet_copy_export_record_write"
  ) {
    reasons.push("handoff_packet_copy_export_preview_not_ready");
  }
  const readiness = getRecord(preview, "copy_export_readiness");
  if (!readiness || readiness.write_ready !== true) {
    reasons.push("handoff_packet_copy_export_preview_readiness_invalid");
  }
  const recordMaterial = getRecord(
    preview,
    "would_write_handoff_packet_copy_export_record_preview",
  );
  if (!recordMaterial) {
    reasons.push("handoff_packet_copy_export_record_material_missing");
  } else {
    reasons.push(...validateRecordMaterial(recordMaterial));
  }
  const authority = getRecord(preview, "authority_boundary");
  if (!authority || !hasReadOnlyPreviewAuthority(authority)) {
    reasons.push("handoff_packet_copy_export_preview_authority_boundary_invalid");
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
  if (approval.operator_decision !== "approve_for_handoff_packet_copy_export_record") {
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
  if (material.record_version !== HANDOFF_PACKET_COPY_EXPORT_RECORD_VERSION) {
    reasons.push("handoff_packet_copy_export_record_version_invalid");
  }
  if (material.scope !== HANDOFF_PACKET_COPY_EXPORT_WRITE_SCOPE) {
    reasons.push("handoff_packet_copy_export_record_scope_invalid");
  }
  for (const key of [
    "requested_operator_ref",
    "requested_idempotency_key",
    "review_confirmation_ref",
    "source_copy_export_contract_record_ref",
    "source_applied_handoff_context_snapshot_ref",
  ]) {
    if (!safeRef(material[key])) reasons.push(`${key}_missing_or_invalid`);
  }
  for (const key of ["source_refs", "evidence_refs"]) {
    const refs = Array.isArray(material[key]) ? material[key] : [];
    if (!refs.length || !refs.every(safeRef)) reasons.push(`${key}_missing_or_invalid`);
  }
  const artifact = getRecord(material, "proposed_exported_packet_artifact");
  if (!isExportedArtifactLike(artifact)) {
    reasons.push("exported_packet_artifact_malformed");
  } else if (
    artifact.payload_hash !==
    calculateHandoffPacketExportedArtifactPayloadHashV01({
      packet_format: artifact.packet_format as HandoffPacketExportedArtifact["packet_format"],
      markdown_payload: artifact.markdown_payload as string | null,
      json_payload: artifact.json_payload as Record<string, unknown> | null,
      capsule_payload: artifact.capsule_payload as Record<string, unknown> | null,
    })
  ) {
    reasons.push("exported_packet_artifact_payload_hash_invalid");
  }
  const authority = getRecord(artifact, "authority_boundary");
  if (authority && !hasReadOnlyPreviewAuthority(authority)) {
    reasons.push("exported_packet_artifact_authority_boundary_invalid");
  }
  return reasons;
}

function buildRecord(
  validation: ValidationResult & {
    ok: true;
    input: HandoffPacketCopyExportWriteInput;
    idempotency_key: string;
  },
): HandoffPacketCopyExportRecord {
  const decisionPreview = validation.input.copy_export_decision_preview;
  const decisionMaterial =
    decisionPreview.would_write_handoff_packet_copy_export_decision_preview;
  const copyExportPreview = decisionMaterial.copy_export_preview;
  if (!copyExportPreview) {
    throw new Error("validated packet copy/export material missing preview");
  }
  const material =
    copyExportPreview.would_write_handoff_packet_copy_export_record_preview;
  const createdAt =
    validation.input.operator_approval.approved_at || new Date().toISOString();
  const artifact = material.proposed_exported_packet_artifact;
  if (!artifact) {
    throw new Error("validated packet copy/export material missing artifact");
  }
  const recordBase = {
    record_version: HANDOFF_PACKET_COPY_EXPORT_RECORD_VERSION,
    idempotency_key: validation.idempotency_key,
    created_at: createdAt,
    scope: HANDOFF_PACKET_COPY_EXPORT_WRITE_SCOPE,
    operator_ref: validation.input.operator_approval.operator_ref,
    source_refs: material.source_refs,
    evidence_refs: material.evidence_refs,
    source_copy_export_contract_record_ref:
      artifact.source_copy_export_contract_record_ref,
    source_applied_handoff_context_snapshot_ref:
      artifact.source_applied_handoff_context_snapshot_ref,
    source_handoff_context_apply_record_ref:
      artifact.source_handoff_context_apply_record_ref,
    source_handoff_context_update_contract_record_ref:
      artifact.source_handoff_context_update_contract_record_ref,
    source_route_integration_read_ref: artifact.source_route_integration_read_ref,
    source_runtime_current_working_perspective_ref:
      artifact.source_runtime_current_working_perspective_ref,
    source_applied_cwp_snapshot_ref: artifact.source_applied_cwp_snapshot_ref,
    requested_packet_format: artifact.packet_format,
    requested_copy_export_target: artifact.copy_export_target,
    exported_artifact_version: HANDOFF_PACKET_EXPORTED_ARTIFACT_VERSION,
    exported_artifact_ref: artifact.artifact_ref,
    exported_packet_artifact: artifact,
    exported_packet_artifact_hash: artifact.payload_hash,
    packet_entry_count: artifact.packet_entry_count,
    packet_section_counts: artifact.packet_section_counts,
    payload_summary: {
      has_markdown_payload: Boolean(artifact.markdown_payload),
      has_json_payload: Boolean(artifact.json_payload),
      has_capsule_payload: Boolean(artifact.capsule_payload),
      payload_hash: artifact.payload_hash,
    },
    authority_profile: createAuthorityProfile(),
    review_status: "copied_exported_as_scoped_local_handoff_packet_artifact" as const,
    persistence_horizon: "local_project_handoff_packet_copy_export_store" as const,
    no_external_copy_export_or_send_performed:
      createNoExternalCopyExportOrSend(),
    write_validation: createWriteValidation({
      decisionPreview,
      material,
      artifactHash: artifact.payload_hash,
    }),
    authority_boundary: createHandoffPacketCopyExportWriteAuthorityBoundaryV01({
      writeNow: true,
    }),
    notes: publicSafeRefs(validation.input.notes ?? []),
  };
  const recordFingerprint = fingerprint(recordBase);
  return {
    ...recordBase,
    record_id: `handoff-packet-copy-export:${recordFingerprint.slice(0, 24)}`,
    record_fingerprint: recordFingerprint,
  };
}

function createAuthorityProfile(): HandoffPacketCopyExportAuthorityProfile {
  return {
    durable_local_handoff_packet_copy_export_record: true,
    durable_local_handoff_packet_exported_artifact: true,
    source_of_truth: false,
    local_project_handoff_packet_copy_export_only: true,
    persistence_horizon: "local_project_handoff_packet_copy_export_store",
    handoff_packet_copy_export_record_written: true,
    handoff_packet_exported_artifact_written: true,
    handoff_packet_materialized_to_local_artifact: true,
    clipboard_written: false,
    file_download_created: false,
    arbitrary_file_written: false,
    handoff_packet_file_written: false,
    handoff_sent: false,
    live_handoff_context_mutated: false,
    selected_refs_written_to_live_handoff: false,
    handoff_packet_copy_export_contract_record_written: false,
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
  artifactHash,
}: {
  decisionPreview: HandoffPacketCopyExportOperatorDecisionPreview;
  material: unknown;
  artifactHash: string;
}): HandoffPacketCopyExportWriteValidation {
  return {
    validation_version: "handoff_packet_copy_export_write_validation.v0.1",
    operator_decision_preview_revalidated: true,
    exported_packet_artifact_revalidated: true,
    payload_hash_revalidated: true,
    refused_sample_fixture_default_or_smoke_material: false,
    refused_unrequested_side_effects: false,
    refused_external_copy_export_or_send: false,
    refused_metric_or_upstream_write: false,
    validation_hash: fingerprint({
      decision_preview_version: decisionPreview.preview_version,
      material,
      artifactHash,
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
  record: HandoffPacketCopyExportRecord | null;
}): HandoffPacketCopyExportReceipt {
  return {
    receipt_version: HANDOFF_PACKET_COPY_EXPORT_RECEIPT_VERSION,
    record_id: record?.record_id ?? null,
    idempotency_key: validation.idempotency_key,
    wrote,
    idempotent_replay: idempotentReplay,
    created_at: new Date().toISOString(),
    refused,
    refusal_reasons: validation.refusal_reasons,
    validation_hash: record?.write_validation.validation_hash ?? null,
    record_fingerprint: record?.record_fingerprint ?? null,
    store_ref: record ? "handoff_packet_copy_export_store.v0.1" : null,
    source_refs: record?.source_refs ?? [],
    no_side_effects: createNoSideEffects(wrote),
  };
}

function storeResult(
  status: HandoffPacketCopyExportWriteStatus,
  record: HandoffPacketCopyExportRecord | null,
  records: HandoffPacketCopyExportRecord[],
  exportedArtifact: HandoffPacketExportedArtifact | null,
  exportedArtifacts: HandoffPacketExportedArtifact[],
  receipt: HandoffPacketCopyExportReceipt,
): HandoffPacketCopyExportStoreResult {
  return {
    store_version: HANDOFF_PACKET_COPY_EXPORT_STORE_VERSION,
    scope: HANDOFF_PACKET_COPY_EXPORT_WRITE_SCOPE,
    status,
    ok:
      status === "written" ||
      status === "idempotent_existing" ||
      status === "read" ||
      status === "listed",
    record,
    records,
    exported_artifact: exportedArtifact,
    exported_artifacts: exportedArtifacts,
    receipt,
    error_code:
      status === "refused" || status === "not_found" || status === "schema_missing"
        ? status
        : null,
    no_side_effects: receipt.no_side_effects,
  };
}

function rowStoreResult(
  status: HandoffPacketCopyExportWriteStatus,
  row: HandoffPacketCopyExportWriteRow,
): HandoffPacketCopyExportStoreResult {
  const record = rowToRecord(row);
  const artifact = rowToArtifact(row);
  return storeResult(status, record, [record], artifact, [artifact], rowToReceipt(row));
}

function schemaMissingResult(
  idempotencyKey: string | null,
): HandoffPacketCopyExportStoreResult {
  return storeResult(
    "schema_missing",
    null,
    [],
    null,
    [],
    createRefusedReceipt(["schema_missing"], idempotencyKey),
  );
}

function notFoundResult(
  idempotencyKey: string | null,
): HandoffPacketCopyExportStoreResult {
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
): HandoffPacketCopyExportReceipt {
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

function createNoSideEffects(wrote: boolean): HandoffPacketCopyExportNoSideEffects {
  return {
    handoff_packet_copy_export_record_written: wrote,
    handoff_packet_copy_export_receipt_written: wrote,
    handoff_packet_copy_export_persisted: wrote,
    handoff_packet_exported_artifact_written: wrote,
    handoff_packet_materialized_to_local_artifact: wrote,
    ...createNoExternalCopyExportOrSend(),
  };
}

function createNoExternalCopyExportOrSend():
  HandoffPacketCopyExportNoExternalCopyExportOrSend {
  return {
    handoff_packet_copied_to_clipboard: false,
    handoff_packet_exported_to_file: false,
    handoff_packet_download_created: false,
    clipboard_written: false,
    file_download_created: false,
    arbitrary_file_written: false,
    handoff_packet_file_written: false,
    handoff_packet_copied: false,
    handoff_packet_exported: false,
    handoff_sent: false,
    live_handoff_context_updated: false,
    live_handoff_context_mutated: false,
    handoff_context_applied_live: false,
    handoff_context_mutated: false,
    selected_refs_written_to_live_handoff: false,
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

function isExportedArtifactLike(value: unknown): value is HandoffPacketExportedArtifact {
  if (!isRecord(value)) return false;
  return Boolean(
    value &&
      value.artifact_version === HANDOFF_PACKET_EXPORTED_ARTIFACT_VERSION &&
      value.scope === HANDOFF_PACKET_COPY_EXPORT_WRITE_SCOPE &&
      safeRef(value.artifact_ref) &&
      value.packet_family === "augnes_operator_handoff_packet" &&
      typeof value.packet_format === "string" &&
      typeof value.copy_export_target === "string" &&
      safeRef(value.source_copy_export_contract_record_ref) &&
      safeRef(value.source_applied_handoff_context_snapshot_ref) &&
      isRecord(value.packet_manifest) &&
      Array.isArray(value.packet_entries) &&
      value.packet_entries.length > 0 &&
      typeof value.packet_entry_count === "number" &&
      isRecord(value.packet_section_counts) &&
      typeof value.payload_hash === "string" &&
      isRecord(value.public_safety_summary) &&
      isRecord(value.artifact_metadata) &&
      isRecord(value.authority_boundary) &&
      value.artifact_metadata.local_artifact_only === true &&
      value.artifact_metadata.clipboard_write_not_performed === true &&
      value.artifact_metadata.file_write_not_performed === true &&
      value.artifact_metadata.download_not_performed === true &&
      value.artifact_metadata.handoff_send_not_performed === true &&
      payloadPresenceMatchesFormat(value),
  );
}

function payloadPresenceMatchesFormat(value: Record<string, unknown>): boolean {
  if (value.packet_format === "operator_handoff_packet_markdown") {
    return typeof value.markdown_payload === "string" &&
      value.json_payload === null &&
      value.capsule_payload === null;
  }
  if (value.packet_format === "codex_handoff_packet_json") {
    return value.markdown_payload === null &&
      isRecord(value.json_payload) &&
      value.capsule_payload === null;
  }
  if (value.packet_format === "conversation_handoff_capsule") {
    return value.markdown_payload === null &&
      value.json_payload === null &&
      isRecord(value.capsule_payload);
  }
  if (value.packet_format === "dual_markdown_and_json") {
    return typeof value.markdown_payload === "string" &&
      isRecord(value.json_payload) &&
      value.capsule_payload === null;
  }
  return false;
}

function hasReadOnlyPreviewAuthority(authority: Record<string, unknown>): boolean {
  return (
    authority.read_only === true &&
    authority.source_of_truth === false &&
    fieldsFalse(authority, readOnlyAuthorityFalseFields)
  );
}

function hasReadOnlyDecisionAuthority(authority: Record<string, unknown>): boolean {
  return (
    authority.read_only === true &&
    authority.advisory_only === true &&
    authority.decision_preview_only === true &&
    authority.source_of_truth === false &&
    fieldsFalse(authority, readOnlyAuthorityFalseFields)
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
  input: HandoffPacketCopyExportWriteInput | null;
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

function rowToRecord(row: HandoffPacketCopyExportWriteRow):
  HandoffPacketCopyExportRecord {
  return JSON.parse(row.record_json) as HandoffPacketCopyExportRecord;
}

function rowToArtifact(row: HandoffPacketCopyExportWriteRow):
  HandoffPacketExportedArtifact {
  return JSON.parse(row.exported_artifact_json) as HandoffPacketExportedArtifact;
}

function rowToReceipt(row: HandoffPacketCopyExportWriteRow):
  HandoffPacketCopyExportReceipt {
  return JSON.parse(row.receipt_json) as HandoffPacketCopyExportReceipt;
}

function getRecord(value: unknown, key: string): Record<string, unknown> | null {
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

function fieldsFalse(value: Record<string, unknown>, fields: readonly string[]): boolean {
  return fields.every((field) => value[field] === false);
}

function fingerprint(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
