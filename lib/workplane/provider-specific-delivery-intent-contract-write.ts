import {
  PROVIDER_SPECIFIC_DELIVERY_INTENT_CONTRACT_RECEIPT_VERSION,
  PROVIDER_SPECIFIC_DELIVERY_INTENT_CONTRACT_RECORD_VERSION,
  PROVIDER_SPECIFIC_DELIVERY_INTENT_CONTRACT_STORE_VERSION,
  PROVIDER_SPECIFIC_DELIVERY_INTENT_OPERATOR_DECISION_PREVIEW_VERSION,
  PROVIDER_SPECIFIC_DELIVERY_INTENT_SCOPE,
  type ProviderSpecificDeliveryIntentContractRecord,
  type ProviderSpecificDeliveryIntentContractReceipt,
  type ProviderSpecificDeliveryIntentContractStoreResult,
  type ProviderSpecificDeliveryIntentContractWriteInput,
  type ProviderSpecificDeliveryIntentWriteStatus,
} from "@/types/provider-specific-delivery-intent-contract";
import {
  createProviderSpecificDeliveryIntentAuthorityBoundaryV01,
  createProviderSpecificDeliveryIntentBoundaryV01,
  fingerprintProviderSpecificDeliveryIntentValueV01,
  providerSpecificDeliveryIntentBoundaryProblemReasonsV01,
  providerSpecificDeliveryIntentRefProblemReasonsV01,
} from "@/lib/workplane/provider-specific-delivery-intent-contract-preview";

type RecordValue = Record<string, unknown>;

export const PROVIDER_SPECIFIC_DELIVERY_INTENT_CONTRACT_TABLE =
  "provider_specific_delivery_intent_contract_records" as const;

export interface ProviderSpecificDeliveryIntentContractDbLike {
  exec(sql: string): unknown;
  prepare(sql: string): {
    run(...params: unknown[]): unknown;
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  };
}

interface ProviderSpecificDeliveryIntentContractRow {
  record_id: string;
  idempotency_key: string;
  created_at: string;
  scope: string;
  operator_ref: string;
  requested_provider_surface: string;
  source_external_handoff_delivery_contract_record_ref: string;
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
  input: ProviderSpecificDeliveryIntentContractWriteInput | null;
  idempotency_key: string | null;
}

const allowedRequestedSideEffectKeys = new Set([
  "can_write_db",
  "can_create_provider_specific_delivery_intent_contract_record",
  "can_create_provider_specific_delivery_intent_contract_receipt",
  "provider_specific_delivery_intent_contract_record_written",
  "provider_specific_delivery_intent_contract_receipt_written",
  "provider_specific_delivery_intent_contract_persisted",
]);

const forbiddenRequestedSideEffectPatterns = [
  /delivery.*performed|external.*message|send.*provider|provider.*called/i,
  /email|slack|webhook|notification|network/i,
  /github|openai|codex|browser|crawler/i,
  /clipboard|download|arbitrary.*file|packet.*file/i,
  /selected.*refs.*live|live.*handoff|handoff.*context.*(mutate|apply|live)/i,
  /external.*delivery.*contract.*record.*written/i,
  /copy.*export|exported.*artifact|packet.*export/i,
  /api.*perspective.*current|route.*(modify|replace|mutate|write)/i,
  /current.*working.*perspective|perspective.*unit|next.*work.*bias|continuity.*relay/i,
  /memory|metric|reuse.*ledger|expected.*observed.*delta|work.*episode/i,
  /\bpr\b.*create|\bpr\b.*merge|autonomous|graph|vector|\brag\b/i,
] as const;

export const providerSpecificDeliveryIntentContractSchemaSqlV01 = `
CREATE TABLE IF NOT EXISTS provider_specific_delivery_intent_contract_records (
  record_id TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  scope TEXT NOT NULL,
  operator_ref TEXT NOT NULL,
  requested_provider_surface TEXT NOT NULL,
  source_external_handoff_delivery_contract_record_ref TEXT NOT NULL,
  source_local_fulfillment_ref TEXT NOT NULL,
  source_exported_artifact_ref TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  record_fingerprint TEXT NOT NULL,
  record_json TEXT NOT NULL,
  receipt_json TEXT NOT NULL,
  UNIQUE(scope, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_provider_specific_delivery_intent_scope_created
  ON provider_specific_delivery_intent_contract_records(scope, created_at, record_id);

CREATE INDEX IF NOT EXISTS idx_provider_specific_delivery_intent_source
  ON provider_specific_delivery_intent_contract_records(scope, requested_provider_surface, source_external_handoff_delivery_contract_record_ref, created_at, record_id);
`;

export function ensureProviderSpecificDeliveryIntentContractSchemaV01(
  db: ProviderSpecificDeliveryIntentContractDbLike,
): void {
  db.exec(providerSpecificDeliveryIntentContractSchemaSqlV01);
}

export function providerSpecificDeliveryIntentContractSchemaExistsV01(
  db: ProviderSpecificDeliveryIntentContractDbLike,
): boolean {
  const row = db
    .prepare(
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name = ?`,
    )
    .get(PROVIDER_SPECIFIC_DELIVERY_INTENT_CONTRACT_TABLE) as
    | { name?: string }
    | undefined;
  return row?.name === PROVIDER_SPECIFIC_DELIVERY_INTENT_CONTRACT_TABLE;
}

export function validateProviderSpecificDeliveryIntentContractWriteInputV01(
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
      ? (input as unknown as ProviderSpecificDeliveryIntentContractWriteInput)
      : null,
    idempotencyKey,
  );
}

export function writeProviderSpecificDeliveryIntentContractRecordV01(
  input: unknown,
  options: { db: ProviderSpecificDeliveryIntentContractDbLike },
): ProviderSpecificDeliveryIntentContractStoreResult {
  const validation =
    validateProviderSpecificDeliveryIntentContractWriteInputV01(input);
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
  ensureProviderSpecificDeliveryIntentContractSchemaV01(options.db);
  const record = buildRecord(validation.input, validation.idempotency_key);
  const existing = readProviderSpecificDeliveryIntentContractByIdempotencyKeyV01(
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
        `INSERT INTO provider_specific_delivery_intent_contract_records (
          record_id,
          idempotency_key,
          created_at,
          scope,
          operator_ref,
          requested_provider_surface,
          source_external_handoff_delivery_contract_record_ref,
          source_local_fulfillment_ref,
          source_exported_artifact_ref,
          payload_hash,
          record_fingerprint,
          record_json,
          receipt_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        record.record_id,
        record.idempotency_key,
        record.created_at,
        record.scope,
        record.operator_ref,
        record.requested_provider_surface,
        record.source_external_handoff_delivery_contract_record_ref,
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
        refusalReasons: ["provider_specific_delivery_intent_insert_failed"],
        record: null,
        wrote: false,
        idempotentReplay: false,
      }),
    );
  }
}

export function readProviderSpecificDeliveryIntentContractByIdV01(
  recordId: string,
  options: { db: ProviderSpecificDeliveryIntentContractDbLike },
): ProviderSpecificDeliveryIntentContractStoreResult {
  if (!providerSpecificDeliveryIntentContractSchemaExistsV01(options.db)) {
    return schemaMissingResult(null);
  }
  const row = options.db
    .prepare(
      `SELECT * FROM provider_specific_delivery_intent_contract_records
       WHERE record_id = ? AND scope = ?`,
    )
    .get(recordId, PROVIDER_SPECIFIC_DELIVERY_INTENT_SCOPE) as
    | ProviderSpecificDeliveryIntentContractRow
    | undefined;
  return row ? rowStoreResult("read", row) : notFoundResult(null);
}

export function readProviderSpecificDeliveryIntentContractByIdempotencyKeyV01(
  idempotencyKey: string,
  options: { db: ProviderSpecificDeliveryIntentContractDbLike },
): ProviderSpecificDeliveryIntentContractStoreResult {
  if (!providerSpecificDeliveryIntentContractSchemaExistsV01(options.db)) {
    return schemaMissingResult(idempotencyKey);
  }
  const row = options.db
    .prepare(
      `SELECT * FROM provider_specific_delivery_intent_contract_records
       WHERE idempotency_key = ? AND scope = ?`,
    )
    .get(idempotencyKey, PROVIDER_SPECIFIC_DELIVERY_INTENT_SCOPE) as
    | ProviderSpecificDeliveryIntentContractRow
    | undefined;
  return row ? rowStoreResult("read", row) : notFoundResult(idempotencyKey);
}

export function listProviderSpecificDeliveryIntentContractRecordsV01(
  options: {
    db: ProviderSpecificDeliveryIntentContractDbLike;
    limit?: number;
    requested_provider_surface?: string;
  },
): ProviderSpecificDeliveryIntentContractStoreResult {
  if (!providerSpecificDeliveryIntentContractSchemaExistsV01(options.db)) {
    return schemaMissingResult(null);
  }
  const limit = Math.max(1, Math.min(options.limit ?? 50, 100));
  const rows = (
    options.requested_provider_surface
      ? options.db
          .prepare(
            `SELECT * FROM provider_specific_delivery_intent_contract_records
             WHERE scope = ? AND requested_provider_surface = ?
             ORDER BY created_at DESC, record_id DESC
             LIMIT ?`,
          )
          .all(
            PROVIDER_SPECIFIC_DELIVERY_INTENT_SCOPE,
            options.requested_provider_surface,
            limit,
          )
      : options.db
          .prepare(
            `SELECT * FROM provider_specific_delivery_intent_contract_records
             WHERE scope = ?
             ORDER BY created_at DESC, record_id DESC
             LIMIT ?`,
          )
          .all(PROVIDER_SPECIFIC_DELIVERY_INTENT_SCOPE, limit)
  ) as ProviderSpecificDeliveryIntentContractRow[];
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
    PROVIDER_SPECIFIC_DELIVERY_INTENT_OPERATOR_DECISION_PREVIEW_VERSION
  ) {
    reasons.push("operator_decision_preview_version_invalid");
  }
  if (
    preview.decision_status !==
    "ready_for_provider_specific_delivery_intent_contract_record_write"
  ) {
    reasons.push("operator_decision_preview_not_ready");
  }
  if (
    preview.recommended_operator_decision !==
    "record_provider_specific_delivery_intent_contract_candidate"
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
    "would_write_provider_specific_delivery_intent_decision_preview",
  );
  const intentPreview = recordField(
    decisionMaterial,
    "provider_specific_delivery_intent_contract_preview",
  );
  const recordPreview = recordField(
    intentPreview,
    "would_write_provider_specific_delivery_intent_contract_record_preview",
  );
  if (
    intentPreview?.status !== "ready_for_intent_decision" ||
    !recordPreview
  ) {
    reasons.push("provider_specific_delivery_intent_preview_material_invalid");
  }
  reasons.push(...validateRecordMaterial(recordPreview));
  return uniqueStrings(reasons);
}

function validateRecordMaterial(material: RecordValue | null): string[] {
  if (!material) return ["provider_specific_delivery_intent_record_material_missing"];
  return uniqueStrings([
    ...requiredStringProblems(material, [
      "source_provider_specific_preview_fingerprint",
      "source_provider_specific_decision_fingerprint",
      "source_external_handoff_delivery_contract_record_ref",
      "source_local_fulfillment_ref",
      "source_handoff_send_contract_record_ref",
      "source_exported_artifact_ref",
      "requested_provider_surface",
      "requested_recipient_ref",
      "requested_payload_format",
      "payload_hash",
      "payload_type",
    ]),
    ...providerSpecificDeliveryIntentRefProblemReasonsV01({
      surface: stringField(material, "requested_provider_surface"),
      providerProfileRef: stringField(material, "provider_profile_ref"),
      requestedRecipientRef: stringField(material, "requested_recipient_ref"),
      requestedPayloadFormat: stringField(material, "requested_payload_format"),
    }),
    ...providerSpecificDeliveryIntentBoundaryProblemReasonsV01(
      recordField(material, "external_delivery_boundary"),
    ),
    ...authorityProblems(recordField(material, "authority_boundary")),
  ]);
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
  if (
    approval.operator_decision !==
    "record_provider_specific_delivery_intent_contract_candidate"
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
  input: ProviderSpecificDeliveryIntentContractWriteInput,
  idempotencyKey: string,
): ProviderSpecificDeliveryIntentContractRecord {
  const decision = input.operator_decision_preview;
  const preview =
    decision.would_write_provider_specific_delivery_intent_decision_preview
      .provider_specific_delivery_intent_contract_preview;
  if (!preview?.would_write_provider_specific_delivery_intent_contract_record_preview) {
    throw new Error("validated provider-specific delivery intent material missing");
  }
  const material =
    preview.would_write_provider_specific_delivery_intent_contract_record_preview;
  const createdAt = input.operator_approval.approved_at;
  const base = {
    record_version: PROVIDER_SPECIFIC_DELIVERY_INTENT_CONTRACT_RECORD_VERSION,
    idempotency_key: idempotencyKey,
    scope: PROVIDER_SPECIFIC_DELIVERY_INTENT_SCOPE,
    created_at: createdAt,
    operator_ref: input.operator_approval.operator_ref,
    source_intent_contract_preview_fingerprint: preview.preview_fingerprint,
    source_operator_decision_fingerprint: decision.decision_preview_fingerprint,
    source_provider_specific_preview_fingerprint:
      material.source_provider_specific_preview_fingerprint,
    source_provider_specific_decision_fingerprint:
      material.source_provider_specific_decision_fingerprint,
    source_external_handoff_delivery_contract_record_ref:
      material.source_external_handoff_delivery_contract_record_ref,
    source_external_handoff_delivery_contract_preview_fingerprint:
      material.source_external_handoff_delivery_contract_preview_fingerprint,
    source_local_fulfillment_ref: material.source_local_fulfillment_ref,
    source_handoff_send_contract_record_ref:
      material.source_handoff_send_contract_record_ref,
    source_exported_artifact_ref: material.source_exported_artifact_ref,
    source_applied_handoff_context_ref:
      material.source_applied_handoff_context_ref,
    requested_provider_surface: material.requested_provider_surface,
    provider_profile_ref: material.provider_profile_ref,
    requested_recipient_ref: material.requested_recipient_ref,
    requested_payload_format: material.requested_payload_format,
    payload_hash: material.payload_hash,
    payload_type: material.payload_type,
    intent_status:
      "recorded_as_provider_specific_delivery_intent_contract_candidate" as const,
    source_refs: material.source_refs,
    evidence_refs: material.evidence_refs,
    provider_requirement_summary: material.provider_requirement_summary,
    residual_gate_summary: material.residual_gate_summary,
    external_delivery_boundary: createProviderSpecificDeliveryIntentBoundaryV01(),
    authority_boundary:
      createProviderSpecificDeliveryIntentAuthorityBoundaryV01({
        writeNow: true,
      }),
    notes: publicSafeRefs(input.notes ?? []),
  };
  const recordFingerprint =
    fingerprintProviderSpecificDeliveryIntentValueV01(base);
  const recordId = `provider-specific-delivery-intent:${recordFingerprint.slice(
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
  record?: ProviderSpecificDeliveryIntentContractRecord | null;
  recordFingerprint?: string | null;
  recordId?: string | null;
  wrote: boolean;
  idempotentReplay: boolean;
}): ProviderSpecificDeliveryIntentContractReceipt {
  return {
    receipt_version: PROVIDER_SPECIFIC_DELIVERY_INTENT_CONTRACT_RECEIPT_VERSION,
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
        ? `provider_specific_delivery_intent_contract_store.v0.1:${record?.record_id ?? recordId}`
        : null,
    no_side_effects: true,
    delivery_performed: false,
    provider_specific_delivery: false,
    provider_called: false,
    external_message_sent: false,
    email_sent: false,
    slack_sent: false,
    webhook_called: false,
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
  return /raw_text|raw_report|raw_excerpt|raw_email_body|raw_message|raw_payload|raw_provider_payload|private_material|secret:|token:|password:|api[_-]?key:|bearer:|https?:\/\//i.test(
    JSON.stringify(value),
  );
}

function validationResult(
  refusalReasons: string[],
  input: ProviderSpecificDeliveryIntentContractWriteInput | null,
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
  status: ProviderSpecificDeliveryIntentWriteStatus,
  record: ProviderSpecificDeliveryIntentContractRecord | null,
  records: ProviderSpecificDeliveryIntentContractRecord[],
  receipt: ProviderSpecificDeliveryIntentContractReceipt,
): ProviderSpecificDeliveryIntentContractStoreResult {
  return {
    store_version: PROVIDER_SPECIFIC_DELIVERY_INTENT_CONTRACT_STORE_VERSION,
    scope: PROVIDER_SPECIFIC_DELIVERY_INTENT_SCOPE,
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
      "Store persists scoped local provider-specific delivery intent contract candidate records only.",
      "An intent contract never means external delivery, provider calls, email, Slack, webhook, network, clipboard, download, file, memory, metric, route, CWP, handoff, relay, GitHub, Codex, browser, or crawler behavior occurred.",
    ],
  };
}

function schemaMissingResult(
  idempotencyKey: string | null,
): ProviderSpecificDeliveryIntentContractStoreResult {
  return storeResult(
    "schema_missing",
    null,
    [],
    createRefusedReceipt(["schema_missing"], idempotencyKey),
  );
}

function notFoundResult(
  idempotencyKey: string | null,
): ProviderSpecificDeliveryIntentContractStoreResult {
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
): ProviderSpecificDeliveryIntentContractReceipt {
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
  row: ProviderSpecificDeliveryIntentContractRow,
): ProviderSpecificDeliveryIntentContractStoreResult {
  const record = rowToRecord(row);
  return storeResult(status, record, [record], rowToReceipt(row));
}

function rowToRecord(
  row: ProviderSpecificDeliveryIntentContractRow,
): ProviderSpecificDeliveryIntentContractRecord {
  return JSON.parse(row.record_json) as ProviderSpecificDeliveryIntentContractRecord;
}

function rowToReceipt(
  row: ProviderSpecificDeliveryIntentContractRow,
): ProviderSpecificDeliveryIntentContractReceipt {
  return JSON.parse(row.receipt_json) as ProviderSpecificDeliveryIntentContractReceipt;
}

function requiredStringProblems(
  record: RecordValue,
  keys: string[],
): string[] {
  return keys.flatMap((key) =>
    safeRef(record[key]) ? [] : [`${key}_missing_or_invalid`],
  );
}

function authorityProblems(value: unknown): string[] {
  const boundary = isRecord(value) ? value : {};
  return [
    "can_send_handoff",
    "can_call_send_provider",
    "can_call_external_messaging",
    "can_call_email",
    "can_call_slack",
    "can_call_webhook",
    "can_call_provider_openai",
    "can_call_github",
    "can_execute_codex",
    "can_call_browser_or_crawler",
    "can_call_network",
    "can_write_clipboard",
    "can_download_file",
    "can_write_arbitrary_file",
    "can_mutate_handoff_context",
    "can_write_selected_refs_to_live_handoff",
    "can_write_external_handoff_delivery_contract_record",
    "can_write_memory",
    "can_write_dogfood_metrics",
    "can_render_workbench_action_button",
  ].flatMap((field) =>
    boundary[field] === true
      ? [`provider_specific_delivery_intent_authority_forbidden_true:${field}`]
      : [],
  );
}

function recordField(value: unknown, key: string): RecordValue | null {
  if (!isRecord(value)) return null;
  return isRecord(value[key]) ? value[key] : null;
}

function stringField(value: unknown, key: string): string | null {
  return isRecord(value) && typeof value[key] === "string"
    ? value[key]
    : null;
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
    !/raw_text|raw_report|raw_excerpt|raw_email_body|raw_message|raw_payload|raw_provider_payload|secret|token|password|api[_-]?key|bearer|private|https?:\/\//i.test(
      value,
    )
    ? value
    : null;
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function isRecord(value: unknown): value is RecordValue {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
