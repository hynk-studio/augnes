import {
  EXTERNAL_HANDOFF_DELIVERY_CONTRACT_RECORD_VERSION,
  EXTERNAL_HANDOFF_DELIVERY_CONTRACT_RECEIPT_VERSION,
  EXTERNAL_HANDOFF_DELIVERY_CONTRACT_SCOPE,
  EXTERNAL_HANDOFF_DELIVERY_CONTRACT_STORE_VERSION,
  EXTERNAL_HANDOFF_DELIVERY_OPERATOR_DECISION_PREVIEW_VERSION,
  type ExternalHandoffDeliveryContractRecord,
  type ExternalHandoffDeliveryContractReceipt,
  type ExternalHandoffDeliveryContractStoreResult,
  type ExternalHandoffDeliveryContractWriteInput,
  type ExternalHandoffDeliveryContractWriteStatus,
} from "@/types/external-handoff-delivery-contract";
import {
  createExternalHandoffDeliveryBoundaryV01,
  createExternalHandoffDeliveryContractAuthorityBoundaryV01,
  fingerprintExternalHandoffDeliveryValueV01,
} from "@/lib/workplane/external-handoff-delivery-contract-preview";

type RecordValue = Record<string, unknown>;

export const EXTERNAL_HANDOFF_DELIVERY_CONTRACT_TABLE =
  "external_handoff_delivery_contract_records" as const;

export interface ExternalHandoffDeliveryContractDbLike {
  exec(sql: string): unknown;
  prepare(sql: string): {
    run(...params: unknown[]): unknown;
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  };
}

interface ExternalHandoffDeliveryContractRow {
  record_id: string;
  idempotency_key: string;
  created_at: string;
  scope: string;
  operator_ref: string;
  source_local_fulfillment_ref: string;
  source_exported_artifact_ref: string;
  payload_hash: string;
  record_fingerprint: string;
  record_json: string;
  receipt_json: string;
}

interface ValidationResult {
  ok: boolean;
  refusal_reasons: string[];
  input: ExternalHandoffDeliveryContractWriteInput | null;
  idempotency_key: string | null;
}

const allowedRequestedSideEffectKeys = new Set([
  "can_write_db",
  "can_create_external_delivery_contract_record",
  "can_create_external_delivery_contract_receipt",
  "external_handoff_delivery_contract_record_written",
  "external_handoff_delivery_contract_receipt_written",
  "external_handoff_delivery_contract_persisted",
]);

const forbiddenRequestedSideEffectPatterns = [
  /delivery.*performed|external.*message|send.*provider|provider.*called/i,
  /email|slack|webhook|notification|network/i,
  /github|openai|codex|browser|crawler/i,
  /clipboard|download|arbitrary.*file|packet.*file/i,
  /selected.*refs.*live|live.*handoff|handoff.*context.*(mutate|apply|live)/i,
  /send.*record.*written|send.*contract.*record.*written/i,
  /copy.*export|exported.*artifact|packet.*export/i,
  /api.*perspective.*current|route.*(modify|replace|mutate|write)/i,
  /current.*working.*perspective|perspective.*unit|next.*work.*bias|continuity.*relay/i,
  /memory|metric|reuse.*ledger|expected.*observed.*delta|work.*episode/i,
  /\bpr\b.*create|\bpr\b.*merge|autonomous|graph|vector|\brag\b/i,
] as const;

export const externalHandoffDeliveryContractSchemaSqlV01 = `
CREATE TABLE IF NOT EXISTS external_handoff_delivery_contract_records (
  record_id TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  scope TEXT NOT NULL,
  operator_ref TEXT NOT NULL,
  source_local_fulfillment_ref TEXT NOT NULL,
  source_exported_artifact_ref TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  record_fingerprint TEXT NOT NULL,
  record_json TEXT NOT NULL,
  receipt_json TEXT NOT NULL,
  UNIQUE(scope, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_external_handoff_delivery_contract_scope_created
  ON external_handoff_delivery_contract_records(scope, created_at, record_id);

CREATE INDEX IF NOT EXISTS idx_external_handoff_delivery_contract_source
  ON external_handoff_delivery_contract_records(scope, source_local_fulfillment_ref, source_exported_artifact_ref, created_at, record_id);
`;

export function ensureExternalHandoffDeliveryContractSchemaV01(
  db: ExternalHandoffDeliveryContractDbLike,
): void {
  db.exec(externalHandoffDeliveryContractSchemaSqlV01);
}

export function externalHandoffDeliveryContractSchemaExistsV01(
  db: ExternalHandoffDeliveryContractDbLike,
): boolean {
  const row = db
    .prepare(
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name = ?`,
    )
    .get(EXTERNAL_HANDOFF_DELIVERY_CONTRACT_TABLE) as
    | { name?: string }
    | undefined;
  return row?.name === EXTERNAL_HANDOFF_DELIVERY_CONTRACT_TABLE;
}

export function validateExternalHandoffDeliveryContractWriteInputV01(
  input: unknown,
): ValidationResult {
  if (!isRecord(input)) {
    return validationResult(["input_must_be_object"], null, null);
  }
  const reasons: string[] = [];
  const idempotencyKey = safeRef(input.idempotency_key);
  if (!idempotencyKey) reasons.push("idempotency_key_missing_or_invalid");
  const decisionPreview = recordField(input, "operator_decision_preview");
  reasons.push(...validateDecisionPreview(decisionPreview));
  const approval = recordField(input, "operator_approval");
  reasons.push(...validateApproval({ approval, decisionPreview }));
  if (
    idempotencyKey &&
    decisionPreview?.requested_idempotency_key &&
    decisionPreview.requested_idempotency_key !== idempotencyKey
  ) {
    reasons.push("idempotency_key_mismatch_with_decision_preview");
  }
  if (containsRawOrPrivateMarkers(input)) {
    reasons.push("raw_or_private_marker_material_refused");
  }
  reasons.push(...requestedSideEffectRefusals(input.requested_side_effects));
  return validationResult(
    uniqueStrings(reasons),
    reasons.length === 0
      ? (input as unknown as ExternalHandoffDeliveryContractWriteInput)
      : null,
    idempotencyKey,
  );
}

export function writeExternalHandoffDeliveryContractRecordV01(
  input: unknown,
  options: { db: ExternalHandoffDeliveryContractDbLike },
): ExternalHandoffDeliveryContractStoreResult {
  const validation = validateExternalHandoffDeliveryContractWriteInputV01(input);
  if (!validation.ok || !validation.input || !validation.idempotency_key) {
    return storeResult(
      "refused",
      null,
      [],
      createReceipt({
        idempotencyKey: validation.idempotency_key,
        refused: true,
        refusalReasons: validation.refusal_reasons,
        record: null,
        wrote: false,
        idempotentReplay: false,
      }),
    );
  }
  ensureExternalHandoffDeliveryContractSchemaV01(options.db);
  const record = buildRecord(validation.input, validation.idempotency_key);
  const existing = readExternalHandoffDeliveryContractByIdempotencyKeyV01(
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
          idempotencyKey: validation.idempotency_key,
          refused: false,
          refusalReasons: [],
          record: existing.record,
          wrote: false,
          idempotentReplay: true,
        }),
      );
    }
    return storeResult(
      "conflict",
      existing.record,
      [existing.record],
      createReceipt({
        idempotencyKey: validation.idempotency_key,
        refused: true,
        refusalReasons: ["idempotency_key_conflict"],
        record: existing.record,
        wrote: false,
        idempotentReplay: false,
      }),
    );
  }
  let transactionStarted = false;
  try {
    options.db.prepare("BEGIN IMMEDIATE").run();
    transactionStarted = true;
    options.db
      .prepare(
        `INSERT INTO external_handoff_delivery_contract_records (
          record_id,
          idempotency_key,
          created_at,
          scope,
          operator_ref,
          source_local_fulfillment_ref,
          source_exported_artifact_ref,
          payload_hash,
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
        record.operator_ref,
        record.source_local_fulfillment_ref,
        record.source_exported_artifact_ref,
        record.payload_hash,
        record.record_fingerprint,
        JSON.stringify(record),
        JSON.stringify(record.receipt),
      );
    options.db.prepare("COMMIT").run();
    transactionStarted = false;
    return storeResult("written", record, [record], record.receipt);
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
        idempotencyKey: validation.idempotency_key,
        refused: true,
        refusalReasons: ["external_delivery_contract_insert_failed"],
        record: null,
        wrote: false,
        idempotentReplay: false,
      }),
    );
  }
}

export function readExternalHandoffDeliveryContractByIdV01(
  recordId: string,
  options: { db: ExternalHandoffDeliveryContractDbLike },
): ExternalHandoffDeliveryContractStoreResult {
  if (!externalHandoffDeliveryContractSchemaExistsV01(options.db)) {
    return schemaMissingResult(null);
  }
  const row = options.db
    .prepare(
      `SELECT * FROM external_handoff_delivery_contract_records
       WHERE record_id = ? AND scope = ?`,
    )
    .get(recordId, EXTERNAL_HANDOFF_DELIVERY_CONTRACT_SCOPE) as
    | ExternalHandoffDeliveryContractRow
    | undefined;
  return row ? rowStoreResult("read", row) : notFoundResult(null);
}

export function readExternalHandoffDeliveryContractByIdempotencyKeyV01(
  idempotencyKey: string,
  options: { db: ExternalHandoffDeliveryContractDbLike },
): ExternalHandoffDeliveryContractStoreResult {
  if (!externalHandoffDeliveryContractSchemaExistsV01(options.db)) {
    return schemaMissingResult(idempotencyKey);
  }
  const row = options.db
    .prepare(
      `SELECT * FROM external_handoff_delivery_contract_records
       WHERE idempotency_key = ? AND scope = ?`,
    )
    .get(idempotencyKey, EXTERNAL_HANDOFF_DELIVERY_CONTRACT_SCOPE) as
    | ExternalHandoffDeliveryContractRow
    | undefined;
  return row ? rowStoreResult("read", row) : notFoundResult(idempotencyKey);
}

export function listExternalHandoffDeliveryContractRecordsV01(
  options: { db: ExternalHandoffDeliveryContractDbLike; limit?: number },
): ExternalHandoffDeliveryContractStoreResult {
  if (!externalHandoffDeliveryContractSchemaExistsV01(options.db)) {
    return schemaMissingResult(null);
  }
  const limit = Math.max(1, Math.min(options.limit ?? 50, 100));
  const rows = options.db
    .prepare(
      `SELECT * FROM external_handoff_delivery_contract_records
       WHERE scope = ?
       ORDER BY created_at DESC, record_id DESC
       LIMIT ?`,
    )
    .all(EXTERNAL_HANDOFF_DELIVERY_CONTRACT_SCOPE, limit) as
    ExternalHandoffDeliveryContractRow[];
  const records = rows.map(rowToRecord);
  return storeResult(
    "listed",
    records[0] ?? null,
    records,
    rows[0] ? rowToReceipt(rows[0]) : createRefusedReceipt(["not_found"], null),
  );
}

function validateDecisionPreview(preview: RecordValue | null): string[] {
  if (!preview) return ["operator_decision_preview_missing"];
  const reasons: string[] = [];
  if (
    preview.decision_preview_version !==
    EXTERNAL_HANDOFF_DELIVERY_OPERATOR_DECISION_PREVIEW_VERSION
  ) {
    reasons.push("operator_decision_preview_version_invalid");
  }
  if (
    preview.decision_status !==
    "ready_for_external_delivery_contract_record_write"
  ) {
    reasons.push("operator_decision_preview_not_ready");
  }
  if (
    preview.recommended_operator_decision !==
    "record_external_delivery_contract_candidate"
  ) {
    reasons.push("operator_decision_preview_recommendation_invalid");
  }
  const readiness = recordField(preview, "write_readiness");
  if (
    readiness?.write_ready !== true ||
    arrayLength(readiness?.current_blockers) > 0 ||
    arrayLength(readiness?.current_missing_evidence) > 0
  ) {
    reasons.push("operator_decision_preview_write_readiness_invalid");
  }
  const decisionMaterial = recordField(
    preview,
    "would_write_external_handoff_delivery_contract_decision_preview",
  );
  const contractPreview = recordField(
    decisionMaterial,
    "external_handoff_delivery_contract_preview",
  );
  if (
    contractPreview?.status !== "ready_for_contract_decision" ||
    !recordField(
      contractPreview,
      "would_write_external_handoff_delivery_contract_record_preview",
    )
  ) {
    reasons.push("external_delivery_contract_preview_material_invalid");
  }
  return reasons;
}

function validateApproval({
  approval,
  decisionPreview,
}: {
  approval: RecordValue | null;
  decisionPreview: RecordValue | null;
}): string[] {
  if (!approval) return ["operator_approval_missing"];
  const reasons: string[] = [];
  if (approval.operator_decision !== "record_external_delivery_contract_candidate") {
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
    decisionPreview?.requested_operator_ref &&
    decisionPreview.requested_operator_ref !== approval.operator_ref
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

function buildRecord(
  input: ExternalHandoffDeliveryContractWriteInput,
  idempotencyKey: string,
): ExternalHandoffDeliveryContractRecord {
  const decision = input.operator_decision_preview;
  const preview =
    decision.would_write_external_handoff_delivery_contract_decision_preview
      .external_handoff_delivery_contract_preview;
  if (!preview?.would_write_external_handoff_delivery_contract_record_preview) {
    throw new Error("validated external delivery contract material missing");
  }
  const material =
    preview.would_write_external_handoff_delivery_contract_record_preview;
  const createdAt = input.operator_approval.approved_at;
  const base = {
    record_version: EXTERNAL_HANDOFF_DELIVERY_CONTRACT_RECORD_VERSION,
    idempotency_key: idempotencyKey,
    scope: EXTERNAL_HANDOFF_DELIVERY_CONTRACT_SCOPE,
    created_at: createdAt,
    operator_ref: input.operator_approval.operator_ref,
    source_preview_fingerprint: preview.preview_fingerprint,
    source_operator_decision_fingerprint: decision.decision_preview_fingerprint,
    source_local_fulfillment_ref: material.source_local_fulfillment_ref,
    source_handoff_send_contract_record_ref:
      material.source_handoff_send_contract_record_ref,
    source_exported_artifact_ref: material.source_exported_artifact_ref,
    source_applied_handoff_context_ref:
      material.source_applied_handoff_context_ref,
    payload_hash: material.payload_hash,
    payload_type: material.payload_type,
    requested_delivery_mode: material.requested_delivery_mode,
    requested_delivery_surface: material.requested_delivery_surface,
    requested_recipient_ref: material.requested_recipient_ref,
    contract_status:
      "recorded_as_external_handoff_delivery_contract_candidate" as const,
    external_delivery_boundary: createExternalHandoffDeliveryBoundaryV01(),
    source_refs: material.source_refs,
    evidence_refs: material.evidence_refs,
    residual_gate_summary: material.residual_gate_summary,
    authority_boundary:
      createExternalHandoffDeliveryContractAuthorityBoundaryV01({
        writeNow: true,
      }),
    notes: publicSafeRefs(input.notes ?? []),
  };
  const recordFingerprint = fingerprintExternalHandoffDeliveryValueV01(base);
  const recordId = `external-handoff-delivery-contract:${recordFingerprint.slice(
    0,
    24,
  )}`;
  const receipt = createReceipt({
    idempotencyKey,
    refused: false,
    refusalReasons: [],
    recordFingerprint,
    recordId,
    wrote: true,
    idempotentReplay: false,
  });
  return {
    ...base,
    record_id: recordId,
    receipt,
    record_fingerprint: recordFingerprint,
  };
}

function createReceipt({
  idempotencyKey,
  refused,
  refusalReasons,
  record,
  recordFingerprint,
  recordId,
  wrote,
  idempotentReplay,
}: {
  idempotencyKey: string | null;
  refused: boolean;
  refusalReasons: string[];
  record?: ExternalHandoffDeliveryContractRecord | null;
  recordFingerprint?: string | null;
  recordId?: string | null;
  wrote: boolean;
  idempotentReplay: boolean;
}): ExternalHandoffDeliveryContractReceipt {
  return {
    receipt_version: EXTERNAL_HANDOFF_DELIVERY_CONTRACT_RECEIPT_VERSION,
    record_id: record?.record_id ?? recordId ?? null,
    idempotency_key: idempotencyKey,
    wrote,
    idempotent_replay: idempotentReplay,
    created_at: new Date().toISOString(),
    refused,
    refusal_reasons: refusalReasons,
    validation_hash: record?.record_fingerprint ?? recordFingerprint ?? null,
    record_fingerprint: record?.record_fingerprint ?? recordFingerprint ?? null,
    store_ref:
      record || recordId
        ? `external_handoff_delivery_contract_store.v0.1:${record?.record_id ?? recordId}`
        : null,
    no_side_effects: true,
    external_delivery_performed: false,
    provider_called: false,
    external_message_sent: false,
    network_called: false,
    clipboard_written: false,
    file_downloaded: false,
  };
}

function requestedSideEffectRefusals(value: unknown): string[] {
  if (!isRecord(value)) return [];
  return Object.entries(value).flatMap(([key, requested]) => {
    if (requested !== true) return [];
    if (allowedRequestedSideEffectKeys.has(key)) return [];
    if (forbiddenRequestedSideEffectPatterns.some((pattern) => pattern.test(key))) {
      return [`forbidden_requested_side_effect:${key}`];
    }
    return [`unsupported_requested_side_effect:${key}`];
  });
}

function containsRawOrPrivateMarkers(value: unknown): boolean {
  return /raw_text|raw_report|raw_excerpt|private_material|secret|password|token/i.test(
    JSON.stringify(value),
  );
}

function validationResult(
  refusalReasons: string[],
  input: ExternalHandoffDeliveryContractWriteInput | null,
  idempotencyKey: string | null,
): ValidationResult {
  return {
    ok: refusalReasons.length === 0,
    refusal_reasons: refusalReasons,
    input,
    idempotency_key: idempotencyKey,
  };
}

function storeResult(
  status: ExternalHandoffDeliveryContractWriteStatus,
  record: ExternalHandoffDeliveryContractRecord | null,
  records: ExternalHandoffDeliveryContractRecord[],
  receipt: ExternalHandoffDeliveryContractReceipt,
): ExternalHandoffDeliveryContractStoreResult {
  return {
    store_version: EXTERNAL_HANDOFF_DELIVERY_CONTRACT_STORE_VERSION,
    scope: EXTERNAL_HANDOFF_DELIVERY_CONTRACT_SCOPE,
    status,
    ok: ["written", "idempotent_existing", "read", "listed"].includes(status),
    error_code: ["written", "idempotent_existing", "read", "listed"].includes(
      status,
    )
      ? null
      : status,
    record,
    records,
    receipt,
    notes: [
      "Store persists scoped local external handoff delivery contract candidate records only.",
      "A contract record never means external delivery, provider calls, email, Slack, webhook, network, clipboard, download, file, memory, metric, route, CWP, handoff, relay, GitHub, Codex, browser, or crawler behavior occurred.",
    ],
  };
}

function schemaMissingResult(
  idempotencyKey: string | null,
): ExternalHandoffDeliveryContractStoreResult {
  return storeResult(
    "schema_missing",
    null,
    [],
    createRefusedReceipt(["schema_missing"], idempotencyKey),
  );
}

function notFoundResult(
  idempotencyKey: string | null,
): ExternalHandoffDeliveryContractStoreResult {
  return storeResult(
    "not_found",
    null,
    [],
    createRefusedReceipt(["not_found"], idempotencyKey),
  );
}

function createRefusedReceipt(
  reasons: string[],
  idempotencyKey: string | null,
): ExternalHandoffDeliveryContractReceipt {
  return createReceipt({
    idempotencyKey,
    refused: true,
    refusalReasons: reasons,
    wrote: false,
    idempotentReplay: false,
    record: null,
  });
}

function rowStoreResult(
  status: "read",
  row: ExternalHandoffDeliveryContractRow,
): ExternalHandoffDeliveryContractStoreResult {
  const record = rowToRecord(row);
  return storeResult(status, record, [record], rowToReceipt(row));
}

function rowToRecord(
  row: ExternalHandoffDeliveryContractRow,
): ExternalHandoffDeliveryContractRecord {
  return JSON.parse(row.record_json) as ExternalHandoffDeliveryContractRecord;
}

function rowToReceipt(
  row: ExternalHandoffDeliveryContractRow,
): ExternalHandoffDeliveryContractReceipt {
  return JSON.parse(row.receipt_json) as ExternalHandoffDeliveryContractReceipt;
}

function recordField(value: unknown, key: string): RecordValue | null {
  if (!isRecord(value)) return null;
  return isRecord(value[key]) ? value[key] : null;
}

function arrayLength(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function publicSafeRefs(values: string[]): string[] {
  return uniqueStrings(values.filter((value) => Boolean(safeRef(value))));
}

function safeRef(value: unknown): string | null {
  return typeof value === "string" &&
    value.trim().length > 0 &&
    !/[<>{}\n\r\t]/.test(value) &&
    !/raw_text|raw_report|raw_excerpt|secret|token|password|private/i.test(value)
    ? value
    : null;
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(safeRef(value))))];
}

function isRecord(value: unknown): value is RecordValue {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
