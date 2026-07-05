import { createHash } from "node:crypto";

import {
  OPERATOR_APPROVED_SELECTED_SESSION_DIGEST_INGEST_DECISION_RECORD_VERSION,
  type OperatorApprovedSelectedSessionDigestIngestDecisionRecord,
} from "@/types/selected-session-digest-ingest-decision-write";
import {
  SELECTED_SESSION_DIGEST_INGEST_RECORD_VERSION,
  SELECTED_SESSION_DIGEST_INGEST_RECEIPT_VERSION,
  SELECTED_SESSION_DIGEST_INGEST_SCOPE,
  SELECTED_SESSION_DIGEST_INGEST_STORE_VERSION,
  type SelectedSessionDigestIngestNoSideEffects,
  type SelectedSessionDigestIngestRecord,
  type SelectedSessionDigestIngestReceipt,
  type SelectedSessionDigestIngestStoreResult,
  type SelectedSessionDigestIngestWriteAuthorityBoundary,
  type SelectedSessionDigestIngestWriteInput,
  type SelectedSessionDigestIngestWriteStatus,
} from "@/types/selected-session-digest-ingest-write";

export const SELECTED_SESSION_DIGEST_INGEST_WRITE_TABLE =
  "selected_session_digest_ingest_records" as const;

export interface SelectedSessionDigestIngestWriteDbLike {
  exec(sql: string): unknown;
  prepare(sql: string): {
    run(...params: unknown[]): unknown;
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  };
}

export interface SelectedSessionDigestIngestWriteListOptions {
  idempotency_key?: string;
  operator_ref?: string;
  source_kind?: string;
  limit?: number;
}

interface SelectedSessionDigestIngestWriteRow {
  record_id: string;
  idempotency_key: string;
  created_at: string;
  scope: string;
  operator_ref: string;
  source_kind: string;
  source_ref: string;
  session_ref: string | null;
  project_ref: string | null;
  record_fingerprint: string;
  record_json: string;
  receipt_json: string;
}

interface ValidationResult {
  ok: boolean;
  refusal_reasons: string[];
  input: SelectedSessionDigestIngestWriteInput | null;
  decision_record: OperatorApprovedSelectedSessionDigestIngestDecisionRecord | null;
  idempotency_key: string | null;
}

const allowedRequestedSideEffectKeys = new Set([
  "can_write_db",
  "can_create_ingest_record",
  "can_create_ingest_receipt",
  "can_write_selected_session_digest_candidate_record",
]);

const forbiddenRequestedSideEffectPatterns = [
  /memory/i,
  /current.*working.*perspective/i,
  /\bcwp\b/i,
  /perspective.*unit/i,
  /next.*work.*bias/i,
  /continuity.*relay/i,
  /handoff.*context/i,
  /selected.*refs.*live/i,
  /send.*handoff/i,
  /dogfood.*metrics/i,
  /reuse.*ledger/i,
  /provider/i,
  /openai/i,
  /github/i,
  /codex/i,
  /\bpr\b.*create/i,
  /create.*pull.*request/i,
  /\bpr\b.*merge/i,
  /merge.*pull.*request/i,
  /autonomous/i,
  /graph/i,
  /vector/i,
  /\brag\b/i,
  /crawler/i,
  /browser.*observer/i,
] as const;

const sampleDefaultOrSmokeMarkers = [
  "sample",
  "fixture",
  "smoke",
  "workbench:default",
  "default_workbench",
  "default-workbench",
] as const;

export const selectedSessionDigestIngestWriteSchemaSqlV01 = `
CREATE TABLE IF NOT EXISTS selected_session_digest_ingest_records (
  record_id TEXT PRIMARY KEY,
  idempotency_key TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL,
  scope TEXT NOT NULL,
  operator_ref TEXT NOT NULL,
  source_kind TEXT NOT NULL,
  source_ref TEXT NOT NULL,
  session_ref TEXT,
  project_ref TEXT,
  record_fingerprint TEXT NOT NULL,
  record_json TEXT NOT NULL,
  receipt_json TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_selected_session_digest_ingest_records_scope_created
  ON selected_session_digest_ingest_records(scope, created_at, record_id);

CREATE INDEX IF NOT EXISTS idx_selected_session_digest_ingest_records_operator
  ON selected_session_digest_ingest_records(scope, operator_ref, created_at, record_id);

CREATE INDEX IF NOT EXISTS idx_selected_session_digest_ingest_records_source_kind
  ON selected_session_digest_ingest_records(scope, source_kind, created_at, record_id);
`;

export function ensureSelectedSessionDigestIngestWriteSchemaV01(
  db: SelectedSessionDigestIngestWriteDbLike,
): void {
  db.exec(selectedSessionDigestIngestWriteSchemaSqlV01);
}

export function selectedSessionDigestIngestWriteSchemaExistsV01(
  db: SelectedSessionDigestIngestWriteDbLike,
): boolean {
  const row = db
    .prepare(
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name = ?`,
    )
    .get(SELECTED_SESSION_DIGEST_INGEST_WRITE_TABLE) as
    | { name?: string }
    | undefined;
  return row?.name === SELECTED_SESSION_DIGEST_INGEST_WRITE_TABLE;
}

export function validateSelectedSessionDigestIngestWriteInputV01(
  input: unknown,
): ValidationResult {
  const reasons: string[] = [];
  if (!isRecord(input)) {
    return validationResult({
      refusal_reasons: ["input_must_be_object"],
      input: null,
      decision_record: null,
      idempotency_key: null,
    });
  }

  const idempotencyKey = asSafePublicRef(input.idempotency_key);
  if (!idempotencyKey) reasons.push("idempotency_key_missing_or_invalid");
  reasons.push(...validateNotesV01(input.notes));

  const decisionRecordLike = getRecord(
    input,
    "operator_approved_decision_record",
  );
  const decisionRecordShapeReasons = validateDecisionRecordShapeV01(
    decisionRecordLike,
  );
  reasons.push(...decisionRecordShapeReasons);
  const decisionRecord =
    decisionRecordLike && decisionRecordShapeReasons.length === 0
      ? (decisionRecordLike as unknown as OperatorApprovedSelectedSessionDigestIngestDecisionRecord)
      : null;

  if (
    idempotencyKey &&
    typeof decisionRecordLike?.idempotency_key === "string" &&
    decisionRecordLike.idempotency_key &&
    idempotencyKey !== decisionRecordLike.idempotency_key
  ) {
    reasons.push("idempotency_key_mismatch_with_decision_record");
  }

  const unsafeRefs = collectUnsafePublicRefs({
    operator_approved_decision_record: decisionRecordLike,
    idempotency_key: input.idempotency_key,
  });
  for (const ref of unsafeRefs) {
    reasons.push(`public_ref_unsafe:${ref.path}`);
  }
  if (containsRawOrPrivateMarkers(input)) {
    reasons.push("raw_or_private_marker_material_refused");
  }
  if (containsSampleDefaultOrSmokeMaterial(input)) {
    reasons.push("sample_fixture_default_or_smoke_material_refused");
  }
  if (decisionReceiptOrStateMutationAlreadyHappened(decisionRecordLike)) {
    reasons.push("decision_record_indicates_actual_ingest_or_state_mutation");
  }
  reasons.push(...findRequestedSideEffectRefusals(input.requested_side_effects));
  reasons.push(
    ...findForbiddenActionRequests({
      requested_side_effects: input.requested_side_effects,
      notes: input.notes,
    }),
  );

  return validationResult({
    refusal_reasons: uniqueSortedStrings(reasons),
    input:
      reasons.length === 0
        ? (input as unknown as SelectedSessionDigestIngestWriteInput)
        : null,
    decision_record: decisionRecord,
    idempotency_key: idempotencyKey,
  });
}

export function writeSelectedSessionDigestIngestRecordV01(
  input: unknown,
  options: { db: SelectedSessionDigestIngestWriteDbLike },
): SelectedSessionDigestIngestStoreResult {
  const validation = validateSelectedSessionDigestIngestWriteInputV01(input);
  if (
    !validation.ok ||
    !validation.input ||
    !validation.decision_record ||
    !validation.idempotency_key
  ) {
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

  ensureSelectedSessionDigestIngestWriteSchemaV01(options.db);
  const record = buildSelectedSessionDigestIngestRecord(
    validation as ValidationResult & {
      ok: true;
      input: SelectedSessionDigestIngestWriteInput;
      decision_record: OperatorApprovedSelectedSessionDigestIngestDecisionRecord;
      idempotency_key: string;
    },
  );
  const existing = readSelectedSessionDigestIngestRecordByIdempotencyKeyV01(
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
        `INSERT INTO selected_session_digest_ingest_records (
          record_id,
          idempotency_key,
          created_at,
          scope,
          operator_ref,
          source_kind,
          source_ref,
          session_ref,
          project_ref,
          record_fingerprint,
          record_json,
          receipt_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        record.record_id,
        record.idempotency_key,
        record.created_at,
        record.scope,
        record.operator_ref,
        record.source_kind,
        record.source_ref,
        record.session_ref,
        record.project_ref,
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
        // Rollback failure still returns a bounded refusal receipt.
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

export function refuseSelectedSessionDigestIngestWriteV01(
  input: unknown,
  extraReasons: string[] = [],
): SelectedSessionDigestIngestStoreResult {
  const validation = validateSelectedSessionDigestIngestWriteInputV01(input);
  const refusalValidation: ValidationResult = {
    ...validation,
    ok: false,
    refusal_reasons: uniqueSortedStrings([
      ...validation.refusal_reasons,
      ...extraReasons,
    ]),
  };
  return storeResult(
    "refused",
    null,
    [],
    createReceipt({
      validation: refusalValidation,
      wrote: false,
      refused: true,
      idempotentReplay: false,
      record: null,
    }),
  );
}

export function readSelectedSessionDigestIngestRecordByIdV01(
  recordId: string,
  options: { db: SelectedSessionDigestIngestWriteDbLike },
): SelectedSessionDigestIngestStoreResult {
  if (!isSafePublicRef(recordId)) {
    return storeResult(
      "refused",
      null,
      [],
      createRefusedReceipt(["record_id_missing_or_invalid"], null),
    );
  }
  if (!selectedSessionDigestIngestWriteSchemaExistsV01(options.db)) {
    return storeResult(
      "schema_missing",
      null,
      [],
      createRefusedReceipt(["schema_missing"], null),
    );
  }
  const row = options.db
    .prepare(
      `SELECT * FROM selected_session_digest_ingest_records
       WHERE record_id = ? AND scope = ?`,
    )
    .get(recordId, SELECTED_SESSION_DIGEST_INGEST_SCOPE) as
    | SelectedSessionDigestIngestWriteRow
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

export function readSelectedSessionDigestIngestRecordByIdempotencyKeyV01(
  idempotencyKey: string,
  options: { db: SelectedSessionDigestIngestWriteDbLike },
): SelectedSessionDigestIngestStoreResult {
  if (!isSafePublicRef(idempotencyKey)) {
    return storeResult(
      "refused",
      null,
      [],
      createRefusedReceipt(
        ["idempotency_key_missing_or_invalid"],
        idempotencyKey,
      ),
    );
  }
  if (!selectedSessionDigestIngestWriteSchemaExistsV01(options.db)) {
    return storeResult(
      "schema_missing",
      null,
      [],
      createRefusedReceipt(["schema_missing"], idempotencyKey),
    );
  }
  const row = options.db
    .prepare(
      `SELECT * FROM selected_session_digest_ingest_records
       WHERE idempotency_key = ? AND scope = ?`,
    )
    .get(
      idempotencyKey,
      SELECTED_SESSION_DIGEST_INGEST_SCOPE,
    ) as SelectedSessionDigestIngestWriteRow | undefined;
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

export function listSelectedSessionDigestIngestRecordsV01(
  options: SelectedSessionDigestIngestWriteListOptions & {
    db: SelectedSessionDigestIngestWriteDbLike;
  },
): SelectedSessionDigestIngestStoreResult {
  if (!selectedSessionDigestIngestWriteSchemaExistsV01(options.db)) {
    return storeResult(
      "schema_missing",
      null,
      [],
      createRefusedReceipt(
        ["schema_missing"],
        options.idempotency_key ?? null,
      ),
    );
  }
  const clauses = ["scope = ?"];
  const params: unknown[] = [SELECTED_SESSION_DIGEST_INGEST_SCOPE];
  if (options.idempotency_key) {
    clauses.push("idempotency_key = ?");
    params.push(options.idempotency_key);
  }
  if (options.operator_ref) {
    clauses.push("operator_ref = ?");
    params.push(options.operator_ref);
  }
  if (options.source_kind) {
    clauses.push("source_kind = ?");
    params.push(options.source_kind);
  }
  const limit = Math.max(1, Math.min(options.limit ?? 50, 100));
  const rows = options.db
    .prepare(
      `SELECT * FROM selected_session_digest_ingest_records
       WHERE ${clauses.join(" AND ")}
       ORDER BY created_at DESC, record_id DESC
       LIMIT ?`,
    )
    .all(...params, limit) as SelectedSessionDigestIngestWriteRow[];
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

export function createSelectedSessionDigestIngestWriteAuthorityBoundaryV01({
  writeNow,
}: {
  writeNow: boolean;
}): SelectedSessionDigestIngestWriteAuthorityBoundary {
  return {
    durable_local_candidate_ingest_record: true,
    source_of_truth: false,
    candidate_record_only: true,
    can_write_db: writeNow,
    can_create_ingest_record: writeNow,
    can_create_ingest_receipt: writeNow,
    can_write_selected_session_digest_candidate_record: writeNow,
    can_write_memory: false,
    can_mutate_memory: false,
    can_promote_memory: false,
    can_mutate_current_working_perspective: false,
    can_write_perspective_unit: false,
    can_write_next_work_bias: false,
    can_update_continuity_relay: false,
    can_mutate_handoff_context: false,
    can_apply_handoff_context: false,
    can_write_selected_refs_to_live_handoff: false,
    can_send_handoff: false,
    can_write_dogfood_metrics: false,
    can_write_reuse_ledger: false,
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
      "Authority is limited to one local selected session digest candidate ingest record and receipt.",
      "This writer cannot write memory, PerspectiveUnit, NextWorkBias, CWP, continuity relay, handoff state, dogfood metrics, reuse ledger, providers, GitHub, Codex, or autonomous actions.",
    ],
  };
}

function validateDecisionRecordShapeV01(
  record: Record<string, unknown> | null,
): string[] {
  if (!record) return ["operator_approved_decision_record_missing"];
  const reasons: string[] = [];
  if (
    record.record_version !==
    OPERATOR_APPROVED_SELECTED_SESSION_DIGEST_INGEST_DECISION_RECORD_VERSION
  ) {
    reasons.push("decision_record_version_invalid");
  }
  if (record.operator_decision !== "approve_for_future_ingest_write") {
    reasons.push("decision_record_operator_decision_not_approved");
  }
  if (!asSafePublicRef(record.record_id)) {
    reasons.push("decision_record_id_missing_or_invalid");
  }
  if (!asSafePublicRef(record.idempotency_key)) {
    reasons.push("decision_record_idempotency_key_missing_or_invalid");
  }
  const futureMaterial = getRecord(record, "approved_future_ingest_material");
  if (!futureMaterial) {
    reasons.push("approved_future_ingest_material_missing");
  } else {
    const selectedRefs = stringsFromArray(
      futureMaterial.selected_digest_candidate_refs,
    );
    const approvedRefs = stringsFromArray(
      futureMaterial.selectable_digest_candidate_refs,
    );
    if (selectedRefs.length === 0) {
      reasons.push("selected_digest_candidate_refs_missing");
    }
    for (const ref of selectedRefs) {
      if (!approvedRefs.includes(ref)) {
        reasons.push("selected_digest_candidate_refs_not_in_decision_material");
      }
    }
    if (!asSafePublicRef(futureMaterial.source_ref)) {
      reasons.push("source_ref_missing");
    }
    if (!asSafePublicRef(futureMaterial.operator_ref)) {
      reasons.push("operator_ref_missing");
    }
    if (
      !asSafePublicRef(futureMaterial.session_ref) &&
      !asSafePublicRef(futureMaterial.project_ref)
    ) {
      reasons.push("session_or_project_ref_missing");
    }
    if (stringsFromArray(futureMaterial.evidence_refs).length === 0) {
      reasons.push("evidence_refs_missing");
    }
    if (
      typeof futureMaterial.source_kind !== "string" ||
      !futureMaterial.source_kind ||
      futureMaterial.source_kind === "missing"
    ) {
      reasons.push("source_kind_missing");
    }
    if (!asSafePublicRef(futureMaterial.privacy_review_confirmation_ref)) {
      reasons.push("privacy_review_confirmation_ref_missing");
    }
    if (futureMaterial.proposed_future_ingest_record_kind !== "selected_session_digest_ingest_record.v0.1") {
      reasons.push("future_ingest_record_kind_invalid");
    }
    if (futureMaterial.proposed_future_ingest_receipt_kind !== "selected_session_digest_ingest_receipt.v0.1") {
      reasons.push("future_ingest_receipt_kind_invalid");
    }
    if (!Array.isArray(futureMaterial.sanitized_candidate_summaries)) {
      reasons.push("sanitized_candidate_summaries_missing_or_invalid");
    }
  }

  const writeValidation = getRecord(record, "write_validation");
  if (
    !writeValidation ||
    writeValidation.write_ready_revalidated !== true ||
    writeValidation.refused_sample_fixture_default_or_smoke_material !== false ||
    writeValidation.refused_unrequested_side_effects !== false ||
    writeValidation.refused_actual_selected_digest_ingest !== false ||
    !asSafePublicRef(writeValidation.validation_hash)
  ) {
    reasons.push("decision_record_write_validation_invalid");
  }
  const authority = getRecord(record, "authority_boundary");
  if (
    !authority ||
    authority.operator_approved_record_only !== true ||
    authority.durable_local_record !== true ||
    authority.source_of_truth !== false ||
    authority.can_create_ingest_record !== false ||
    authority.can_create_ingest_receipt !== false ||
    authority.can_write_selected_session_digest !== false
  ) {
    reasons.push("decision_record_authority_boundary_invalid");
  }
  const evidenceSummary = getRecord(record, "evidence_summary");
  if (
    !evidenceSummary ||
    evidenceSummary.has_missing_evidence === true ||
    evidenceSummary.has_refusal_reasons === true ||
    evidenceSummary.has_unsafe_refs === true ||
    !Array.isArray(evidenceSummary.evidence_refs) ||
    !Array.isArray(evidenceSummary.missing_evidence) ||
    evidenceSummary.missing_evidence.length > 0
  ) {
    reasons.push("decision_record_evidence_summary_invalid");
  }
  return uniqueSortedStrings(reasons);
}

function buildSelectedSessionDigestIngestRecord(
  validation: ValidationResult & {
    ok: true;
    input: SelectedSessionDigestIngestWriteInput;
    decision_record: OperatorApprovedSelectedSessionDigestIngestDecisionRecord;
    idempotency_key: string;
  },
): SelectedSessionDigestIngestRecord {
  const decisionRecord = validation.decision_record;
  const material = decisionRecord.approved_future_ingest_material;
  const validationHash = createValidationHash({
    operator_approved_decision_record: decisionRecord,
    idempotency_key: validation.idempotency_key,
  });
  const recordId = createRecordId(validation.idempotency_key);
  const sourceRefs = uniqueSortedStrings([
    SELECTED_SESSION_DIGEST_INGEST_RECORD_VERSION,
    SELECTED_SESSION_DIGEST_INGEST_STORE_VERSION,
    ...decisionRecord.source_refs,
    ...material.source_refs,
    ...material.evidence_refs,
    decisionRecord.record_id,
    decisionRecord.record_fingerprint,
    material.contract_preview_ref ?? "",
    material.intake_preview_ref ?? "",
    ...material.selected_digest_candidate_refs,
  ]).filter(isSafePublicRef);

  const recordWithoutFingerprint: Omit<
    SelectedSessionDigestIngestRecord,
    "record_fingerprint"
  > = {
    record_version: SELECTED_SESSION_DIGEST_INGEST_RECORD_VERSION,
    record_id: recordId,
    idempotency_key: validation.idempotency_key,
    created_at: decisionRecord.created_at,
    scope: SELECTED_SESSION_DIGEST_INGEST_SCOPE,
    source_refs: sourceRefs,
    evidence_refs: uniqueSortedStrings(material.evidence_refs).filter(
      isSafePublicRef,
    ),
    decision_record_refs: {
      decision_record_version: decisionRecord.record_version,
      decision_record_id: decisionRecord.record_id,
      decision_record_fingerprint: decisionRecord.record_fingerprint,
      decision_idempotency_key: decisionRecord.idempotency_key,
      decision_created_at: decisionRecord.created_at,
      operator_decision: decisionRecord.operator_decision,
    },
    ingest_contract_preview_refs: uniqueSortedStrings([
      material.contract_preview_ref ?? "",
      ...decisionRecord.ingest_contract_preview_refs.source_refs,
    ]).filter(isSafePublicRef),
    intake_preview_refs: uniqueSortedStrings([
      material.intake_preview_ref ?? "",
    ]).filter(isSafePublicRef),
    source_kind: String(material.source_kind),
    source_ref: material.source_ref ?? "",
    operator_ref: material.operator_ref ?? "",
    session_ref: material.session_ref,
    project_ref: material.project_ref,
    selected_digest_candidate_refs: material.selected_digest_candidate_refs,
    candidate_counts_by_kind: material.candidate_counts_by_kind,
    sanitized_candidate_summaries: material.sanitized_candidate_summaries,
    privacy_review_confirmation_ref:
      material.privacy_review_confirmation_ref ?? "",
    requested_ingest_scope_ref: material.requested_ingest_scope_ref,
    authority_profile: {
      durable_local_candidate_ingest_record: true,
      source_of_truth: false,
      candidate_record_only: true,
      persistence_horizon: "local_project_candidate_record",
      memory_promotion_performed: false,
      perspective_promotion_performed: false,
    },
    review_status: "ingested_as_candidate_record",
    persistence_horizon: "local_project_candidate_record",
    raw_material_policy: {
      digest_material_stored: false,
      pasted_text_material_stored: false,
      excerpt_material_stored: false,
      sanitized_candidate_summaries_only: true,
      private_or_secret_markers_allowed: false,
    },
    carry_forward_review_only_material: decisionRecord.carry_forward_material,
    no_promotion_performed: {
      memory_promoted: false,
      current_working_perspective_updated: false,
      perspective_unit_written: false,
      next_work_bias_written: false,
      continuity_relay_written: false,
      handoff_context_mutated: false,
      selected_refs_written_to_live_handoff: false,
      handoff_sent: false,
    },
    write_validation: {
      validation_version: "selected_session_digest_ingest_write_validation.v0.1",
      decision_record_revalidated: true,
      selected_candidate_refs_revalidated: true,
      refused_sample_fixture_default_or_smoke_material: false,
      refused_unrequested_side_effects: false,
      refused_memory_perspective_handoff_promotion: false,
      validation_hash: validationHash,
    },
    authority_boundary: createSelectedSessionDigestIngestWriteAuthorityBoundaryV01({
      writeNow: true,
    }),
    notes: uniqueSortedStrings([
      "Written as a local selected session digest candidate ingest record only.",
      "This record does not promote selected digest material into memory, Perspective, CWP, continuity relay, or handoff state.",
      ...(validation.input.notes ?? []),
    ]),
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
  record: SelectedSessionDigestIngestRecord | null;
}): SelectedSessionDigestIngestReceipt {
  const sourceRefs = uniqueSortedStrings([
    ...sourceRefsFromDecisionRecord(validation.decision_record),
    ...(record?.source_refs ?? []),
  ]);
  return {
    receipt_version: SELECTED_SESSION_DIGEST_INGEST_RECEIPT_VERSION,
    record_id: record?.record_id ?? null,
    idempotency_key: validation.idempotency_key,
    wrote,
    idempotent_replay: idempotentReplay,
    created_at: record?.created_at ?? new Date(0).toISOString(),
    refused,
    refusal_reasons: refused ? validation.refusal_reasons : [],
    validation_hash: record?.write_validation.validation_hash ?? null,
    record_fingerprint: record?.record_fingerprint ?? null,
    store_ref: record
      ? `${SELECTED_SESSION_DIGEST_INGEST_WRITE_TABLE}:${record.record_id}`
      : null,
    source_refs: sourceRefs,
    no_side_effects: createNoSideEffectsV01({
      candidateRecordWritten: wrote,
    }),
  };
}

function createRefusedReceipt(
  refusalReasons: string[],
  idempotencyKey: string | null,
): SelectedSessionDigestIngestReceipt {
  return {
    receipt_version: SELECTED_SESSION_DIGEST_INGEST_RECEIPT_VERSION,
    record_id: null,
    idempotency_key: idempotencyKey,
    wrote: false,
    idempotent_replay: false,
    created_at: new Date(0).toISOString(),
    refused: true,
    refusal_reasons: uniqueSortedStrings(refusalReasons),
    validation_hash: null,
    record_fingerprint: null,
    store_ref: null,
    source_refs: [],
    no_side_effects: createNoSideEffectsV01({
      candidateRecordWritten: false,
    }),
  };
}

function storeResult(
  status: SelectedSessionDigestIngestWriteStatus,
  record: SelectedSessionDigestIngestRecord | null,
  records: SelectedSessionDigestIngestRecord[],
  receipt: SelectedSessionDigestIngestReceipt,
): SelectedSessionDigestIngestStoreResult {
  return {
    store_version: SELECTED_SESSION_DIGEST_INGEST_STORE_VERSION,
    scope: SELECTED_SESSION_DIGEST_INGEST_SCOPE,
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
      status === "written" ||
      status === "idempotent_existing" ||
      status === "read" ||
      status === "listed"
        ? null
        : status,
    no_side_effects: receipt.no_side_effects,
  };
}

function rowToRecord(
  row: SelectedSessionDigestIngestWriteRow,
): SelectedSessionDigestIngestRecord {
  return JSON.parse(row.record_json) as SelectedSessionDigestIngestRecord;
}

function rowToReceipt(
  row: SelectedSessionDigestIngestWriteRow,
): SelectedSessionDigestIngestReceipt {
  return JSON.parse(row.receipt_json) as SelectedSessionDigestIngestReceipt;
}

function createNoSideEffectsV01({
  candidateRecordWritten,
}: {
  candidateRecordWritten: boolean;
}): SelectedSessionDigestIngestNoSideEffects {
  return {
    selected_session_digest_ingest_record_written: candidateRecordWritten,
    selected_session_digest_ingest_receipt_written: candidateRecordWritten,
    selected_session_digest_persisted_as_candidate_record:
      candidateRecordWritten,
    memory_mutated: false,
    current_working_perspective_updated: false,
    perspective_unit_written: false,
    next_work_bias_written: false,
    continuity_relay_written: false,
    handoff_context_mutated: false,
    selected_refs_written_to_live_handoff: false,
    handoff_sent: false,
    dogfood_metrics_written: false,
    reuse_ledger_written: false,
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

function validationResult({
  refusal_reasons,
  input,
  decision_record,
  idempotency_key,
}: Omit<ValidationResult, "ok">): ValidationResult {
  return {
    ok: refusal_reasons.length === 0,
    refusal_reasons,
    input,
    decision_record,
    idempotency_key,
  };
}

function createRecordId(idempotencyKey: string): string {
  return `selected_session_digest_ingest:${hashString(idempotencyKey).slice(0, 24)}`;
}

function createValidationHash(value: unknown): string {
  return `sha256:${hashString(stableStringify(value))}`;
}

function createRecordFingerprint(value: unknown): string {
  return `sha256:${hashString(stableStringify(value))}`;
}

function hashString(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, nested]) => `${JSON.stringify(key)}:${stableStringify(nested)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function sourceRefsFromDecisionRecord(
  record: OperatorApprovedSelectedSessionDigestIngestDecisionRecord | null,
): string[] {
  if (!record) return [];
  return uniqueSortedStrings([
    record.record_version,
    record.record_id,
    record.record_fingerprint,
    ...record.source_refs,
    ...record.approved_future_ingest_material.source_refs,
    ...record.approved_future_ingest_material.evidence_refs,
    record.approved_future_ingest_material.contract_preview_ref ?? "",
    record.approved_future_ingest_material.intake_preview_ref ?? "",
  ]).filter(isSafePublicRef);
}

function validateNotesV01(value: unknown): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    return ["notes_must_be_string_array"];
  }
  const reasons: string[] = [];
  for (const note of value) {
    const trimmed = note.trim();
    if (!trimmed || trimmed.length > 500 || hasUnsafeTextMarker(trimmed)) {
      reasons.push("notes_contains_unsafe_or_invalid_text");
    }
  }
  return uniqueSortedStrings(reasons);
}

function collectUnsafePublicRefs(
  value: unknown,
  path = "input",
): Array<{ path: string }> {
  if (typeof value === "string") {
    return isSafePublicRef(value) ? [] : [{ path }];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      collectUnsafePublicRefs(item, `${path}[${index}]`),
    );
  }
  if (!isRecord(value)) return [];
  return Object.entries(value).flatMap(([key, nested]) => {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.includes("summary") ||
      lowerKey.includes("label") ||
      lowerKey.includes("notes")
    ) {
      return [];
    }
    if (
      lowerKey.includes("ref") ||
      lowerKey.includes("idempotency") ||
      lowerKey.includes("operator") ||
      lowerKey.includes("record_id") ||
      lowerKey.includes("fingerprint")
    ) {
      return collectUnsafePublicRefs(nested, `${path}.${key}`);
    }
    return [];
  });
}

function findRequestedSideEffectRefusals(value: unknown): string[] {
  if (value === undefined) return [];
  if (!isRecord(value)) return ["requested_side_effects_must_be_object"];
  const reasons: string[] = [];
  for (const [key, nested] of Object.entries(value)) {
    if (!allowedRequestedSideEffectKeys.has(key)) {
      reasons.push(`requested_side_effect_not_allowed:${key}`);
    }
    if (nested !== true) {
      reasons.push(`requested_side_effect_value_not_true:${key}`);
    }
    if (
      !allowedRequestedSideEffectKeys.has(key) &&
      forbiddenRequestedSideEffectPatterns.some((pattern) => pattern.test(key))
    ) {
      reasons.push(`requested_side_effect_forbidden:${key}`);
    }
  }
  return uniqueSortedStrings(reasons);
}

function findForbiddenActionRequests(input: Record<string, unknown>): string[] {
  const json = JSON.stringify(input).toLowerCase();
  const reasons: string[] = [];
  for (const pattern of forbiddenRequestedSideEffectPatterns) {
    if (pattern.test(json)) {
      reasons.push("forbidden_memory_perspective_handoff_or_external_action_requested");
    }
  }
  return uniqueSortedStrings(reasons);
}

function containsRawOrPrivateMarkers(value: unknown): boolean {
  return hasUnsafeTextMarker(JSON.stringify(value ?? {}));
}

function containsSampleDefaultOrSmokeMaterial(value: unknown): boolean {
  return collectStringValues(value).some((text) => {
    const normalized = text.toLowerCase();
    return sampleDefaultOrSmokeMarkers.some((marker) =>
      normalized.includes(marker),
    );
  });
}

function decisionReceiptOrStateMutationAlreadyHappened(value: unknown): boolean {
  const json = JSON.stringify(value ?? {});
  return (
    /"selected_session_digest_ingest_record_written"\s*:\s*true/i.test(json) ||
    /"selected_session_digest_ingest_receipt_written"\s*:\s*true/i.test(json) ||
    /"memory_mutated"\s*:\s*true/i.test(json) ||
    /"current_working_perspective_updated"\s*:\s*true/i.test(json) ||
    /"perspective_unit_written"\s*:\s*true/i.test(json) ||
    /"next_work_bias_written"\s*:\s*true/i.test(json) ||
    /"continuity_relay_written"\s*:\s*true/i.test(json) ||
    /"handoff_context_mutated"\s*:\s*true/i.test(json) ||
    /"handoff_sent"\s*:\s*true/i.test(json) ||
    /"provider_called"\s*:\s*true/i.test(json) ||
    /"github_called"\s*:\s*true/i.test(json) ||
    /"codex_executed"\s*:\s*true/i.test(json)
  );
}

function asSafePublicRef(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return isSafePublicRef(value) ? value : null;
}

function stringsFromArray(value: unknown): string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
    ? value
    : [];
}

function collectStringValues(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectStringValues);
  if (!isRecord(value)) return [];
  return Object.values(value).flatMap(collectStringValues);
}

function getRecord(
  value: unknown,
  field: string,
): Record<string, unknown> | null {
  if (!isRecord(value)) return null;
  const nested = value[field];
  return isRecord(nested) ? nested : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function uniqueSortedStrings(values: readonly unknown[]): string[] {
  return Array.from(
    new Set(
      values
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ).sort();
}

function isSafePublicRef(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.length > 240) return false;
  if (trimmed !== value) return false;
  if (/[\r\n\t\0]/.test(trimmed)) return false;
  if (trimmed.startsWith("/") || /^[A-Za-z]:/.test(trimmed)) return false;
  if (trimmed.includes("..") || trimmed.includes("\\") || trimmed.includes("//")) {
    return false;
  }
  if (/(^|[:/@|=])(sk-|ghp_|github_pat_|xoxb-)/i.test(trimmed)) {
    return false;
  }
  if (/(^|[:|=])[a-z][a-z0-9+.-]*:\/\/[^/\s]+@/i.test(trimmed)) {
    return false;
  }
  return !hasUnsafeTextMarker(trimmed);
}

function hasUnsafeTextMarker(value: string): boolean {
  return (
    /(^|[:/@|=])(sk-|ghp_|github_pat_|xoxb-)/i.test(value) ||
    /(^|[:|=])[a-z][a-z0-9+.-]*:\/\/[^/\s]+@/i.test(value) ||
    /password:/i.test(value) ||
    /secret:/i.test(value) ||
    /\/Users\//.test(value) ||
    /\/home\//.test(value) ||
    /\.env/i.test(value) ||
    /raw_text/i.test(value) ||
    /raw_digest/i.test(value) ||
    /raw_excerpt/i.test(value)
  );
}
