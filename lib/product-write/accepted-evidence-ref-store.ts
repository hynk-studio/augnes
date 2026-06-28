import type {
  ProductWriteAcceptedEvidenceRefListFilters,
  ProductWriteAcceptedEvidenceRefRecord,
  ProductWriteAcceptedEvidenceRefReasonCode,
  ProductWriteAcceptedEvidenceRefStatus,
} from "../../types/product-write-accepted-evidence-ref";

export const PRODUCT_WRITE_ACCEPTED_EVIDENCE_REF_TABLE =
  "product_write_accepted_evidence_ref_writes" as const;

export interface ProductWriteAcceptedEvidenceRefDbLike {
  exec(sql: string): unknown;
  prepare(sql: string): {
    run(...params: unknown[]): unknown;
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  };
}

export interface ProductWriteAcceptedEvidenceRefStoreWriteResult {
  status: Extract<
    ProductWriteAcceptedEvidenceRefStatus,
    "written" | "idempotent_existing" | "conflict_existing_idempotency_key" | "blocked_invalid_input"
  >;
  record: ProductWriteAcceptedEvidenceRefRecord | null;
  records: ProductWriteAcceptedEvidenceRefRecord[];
  reason_codes: ProductWriteAcceptedEvidenceRefReasonCode[];
}

interface ProductWriteAcceptedEvidenceRefRow {
  accepted_evidence_ref_write_id: string;
  scope: string;
  target_group: string;
  idempotency_key: string;
  payload_fingerprint: string;
  promotion_decision_ref: string;
  formation_receipt_ref: string;
  review_record_ref: string;
  public_safe_source_refs_json: string;
  accepted_evidence_refs_json: string;
  product_write_reentry_review_ref: string;
  product_write_target_contract_ref: string;
  preview_to_write_diff_ref: string;
  rollback_or_abort_plan_ref: string;
  operator_approval_ref: string;
  operator_actor_ref: string;
  operator_approval_payload_json: string;
  reason_codes_json: string;
  boundary_notes_json: string;
  authority_boundary_json: string;
  created_at: string;
  updated_at: string;
}

const scope = "project:augnes" as const;
const targetGroup = "accepted_evidence_records" as const;

export const productWriteAcceptedEvidenceRefStoreSchemaSqlV01 = `
CREATE TABLE IF NOT EXISTS product_write_accepted_evidence_ref_writes (
  accepted_evidence_ref_write_id text primary key,
  scope text not null,
  target_group text not null,
  idempotency_key text not null unique,
  payload_fingerprint text not null,
  promotion_decision_ref text not null,
  formation_receipt_ref text not null,
  review_record_ref text not null,
  public_safe_source_refs_json text not null,
  accepted_evidence_refs_json text not null,
  product_write_reentry_review_ref text not null,
  product_write_target_contract_ref text not null,
  preview_to_write_diff_ref text not null,
  rollback_or_abort_plan_ref text not null,
  operator_approval_ref text not null,
  operator_actor_ref text not null,
  operator_approval_payload_json text not null,
  reason_codes_json text not null,
  boundary_notes_json text not null,
  authority_boundary_json text not null,
  created_at text not null,
  updated_at text not null
);

CREATE INDEX IF NOT EXISTS idx_product_write_accepted_evidence_ref_writes_promotion
  ON product_write_accepted_evidence_ref_writes(scope, promotion_decision_ref, created_at);

CREATE INDEX IF NOT EXISTS idx_product_write_accepted_evidence_ref_writes_receipt
  ON product_write_accepted_evidence_ref_writes(scope, formation_receipt_ref, created_at);

CREATE INDEX IF NOT EXISTS idx_product_write_accepted_evidence_ref_writes_review
  ON product_write_accepted_evidence_ref_writes(scope, review_record_ref, created_at);

CREATE INDEX IF NOT EXISTS idx_product_write_accepted_evidence_ref_writes_operator_approval
  ON product_write_accepted_evidence_ref_writes(scope, operator_approval_ref, created_at);
`;

export function ensureAcceptedEvidenceRefStoreSchemaV01(
  db: ProductWriteAcceptedEvidenceRefDbLike,
): void {
  db.exec(productWriteAcceptedEvidenceRefStoreSchemaSqlV01);
}

export function acceptedEvidenceRefStoreSchemaExistsV01(
  db: ProductWriteAcceptedEvidenceRefDbLike,
): boolean {
  const row = db
    .prepare(
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name = ?`,
    )
    .get(PRODUCT_WRITE_ACCEPTED_EVIDENCE_REF_TABLE) as { name?: string } | undefined;
  return row?.name === PRODUCT_WRITE_ACCEPTED_EVIDENCE_REF_TABLE;
}

export function writeAcceptedEvidenceRefRecordV01(
  record: ProductWriteAcceptedEvidenceRefRecord,
  db: ProductWriteAcceptedEvidenceRefDbLike,
): ProductWriteAcceptedEvidenceRefStoreWriteResult {
  const existing = readAcceptedEvidenceRefRecordByIdempotencyKeyV01(record.idempotency_key, db);
  if (existing) {
    if (existing.payload_fingerprint === record.payload_fingerprint) {
      return {
        status: "idempotent_existing",
        record: existing,
        records: [existing],
        reason_codes: ["idempotent_replay"],
      };
    }
    return {
      status: "conflict_existing_idempotency_key",
      record: existing,
      records: [existing],
      reason_codes: ["idempotency_conflict"],
    };
  }

  let transactionStarted = false;
  try {
    db.prepare("BEGIN IMMEDIATE").run();
    transactionStarted = true;
    db.prepare(
      `INSERT INTO product_write_accepted_evidence_ref_writes (
        accepted_evidence_ref_write_id,
        scope,
        target_group,
        idempotency_key,
        payload_fingerprint,
        promotion_decision_ref,
        formation_receipt_ref,
        review_record_ref,
        public_safe_source_refs_json,
        accepted_evidence_refs_json,
        product_write_reentry_review_ref,
        product_write_target_contract_ref,
        preview_to_write_diff_ref,
        rollback_or_abort_plan_ref,
        operator_approval_ref,
        operator_actor_ref,
        operator_approval_payload_json,
        reason_codes_json,
        boundary_notes_json,
        authority_boundary_json,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      record.accepted_evidence_ref_write_id,
      record.scope,
      record.target_group,
      record.idempotency_key,
      record.payload_fingerprint,
      record.promotion_decision_ref,
      record.formation_receipt_ref,
      record.review_record_ref,
      JSON.stringify(record.public_safe_source_refs),
      JSON.stringify(record.accepted_evidence_refs),
      record.product_write_reentry_review_ref,
      record.product_write_target_contract_ref,
      record.preview_to_write_diff_ref,
      record.rollback_or_abort_plan_ref,
      record.operator_approval_ref,
      record.operator_actor_ref,
      JSON.stringify(record.operator_approval_payload),
      JSON.stringify(record.reason_codes),
      JSON.stringify(record.boundary_notes),
      JSON.stringify(record.authority_boundary),
      record.created_at,
      record.updated_at,
    );
    db.prepare("COMMIT").run();
    transactionStarted = false;
    return {
      status: "written",
      record,
      records: [record],
      reason_codes: [
        "accepted_evidence_ref_write_record_written",
        "db_write_executed_for_accepted_evidence_ref_record_only",
      ],
    };
  } catch {
    if (transactionStarted) {
      try {
        db.prepare("ROLLBACK").run();
      } catch {
        // Rollback failure is returned as a bounded invalid-input result.
      }
    }
    return {
      status: "blocked_invalid_input",
      record: null,
      records: [],
      reason_codes: ["payload_invalid"],
    };
  }
}

export function readAcceptedEvidenceRefRecordV01(
  acceptedEvidenceRefWriteId: string,
  db: ProductWriteAcceptedEvidenceRefDbLike,
): ProductWriteAcceptedEvidenceRefRecord | null {
  const row = db
    .prepare(
      `SELECT * FROM product_write_accepted_evidence_ref_writes
       WHERE accepted_evidence_ref_write_id = ? AND scope = ?`,
    )
    .get(acceptedEvidenceRefWriteId, scope) as ProductWriteAcceptedEvidenceRefRow | undefined;
  return row ? rowToRecord(row) : null;
}

export function readAcceptedEvidenceRefRecordByIdempotencyKeyV01(
  idempotencyKey: string,
  db: ProductWriteAcceptedEvidenceRefDbLike,
): ProductWriteAcceptedEvidenceRefRecord | null {
  const row = db
    .prepare(
      `SELECT * FROM product_write_accepted_evidence_ref_writes
       WHERE idempotency_key = ? AND scope = ? AND target_group = ?`,
    )
    .get(idempotencyKey, scope, targetGroup) as ProductWriteAcceptedEvidenceRefRow | undefined;
  return row ? rowToRecord(row) : null;
}

export function listAcceptedEvidenceRefRecordsV01(
  filters: ProductWriteAcceptedEvidenceRefListFilters,
  db: ProductWriteAcceptedEvidenceRefDbLike,
): ProductWriteAcceptedEvidenceRefRecord[] {
  const clauses = ["scope = ?", "target_group = ?"];
  const params: unknown[] = [scope, targetGroup];
  if (filters.promotion_decision_ref) {
    clauses.push("promotion_decision_ref = ?");
    params.push(filters.promotion_decision_ref);
  }
  if (filters.formation_receipt_ref) {
    clauses.push("formation_receipt_ref = ?");
    params.push(filters.formation_receipt_ref);
  }
  if (filters.review_record_ref) {
    clauses.push("review_record_ref = ?");
    params.push(filters.review_record_ref);
  }
  if (filters.operator_approval_ref) {
    clauses.push("operator_approval_ref = ?");
    params.push(filters.operator_approval_ref);
  }
  const limit = Number.isInteger(filters.limit) && filters.limit ? Math.min(Math.max(filters.limit, 1), 100) : 100;
  const rows = db
    .prepare(
      `SELECT * FROM product_write_accepted_evidence_ref_writes
       WHERE ${clauses.join(" AND ")}
       ORDER BY created_at ASC, accepted_evidence_ref_write_id ASC
       LIMIT ?`,
    )
    .all(...params, limit) as ProductWriteAcceptedEvidenceRefRow[];
  return rows.map(rowToRecord);
}

function rowToRecord(row: ProductWriteAcceptedEvidenceRefRow): ProductWriteAcceptedEvidenceRefRecord {
  return {
    record_version: "product_write_accepted_evidence_ref_record.v0.1",
    store_version: "product_write_accepted_evidence_ref_store.v0.1",
    runtime_version: "product_write_accepted_evidence_ref_runtime.v0.1",
    scope: "project:augnes",
    target_group: "accepted_evidence_records",
    accepted_evidence_ref_write_id: row.accepted_evidence_ref_write_id,
    idempotency_key: row.idempotency_key,
    payload_fingerprint: row.payload_fingerprint,
    promotion_decision_ref: row.promotion_decision_ref,
    formation_receipt_ref: row.formation_receipt_ref,
    review_record_ref: row.review_record_ref,
    public_safe_source_refs: parseStringArray(row.public_safe_source_refs_json),
    accepted_evidence_refs: parseStringArray(row.accepted_evidence_refs_json),
    product_write_reentry_review_ref: row.product_write_reentry_review_ref,
    product_write_target_contract_ref: row.product_write_target_contract_ref,
    preview_to_write_diff_ref: row.preview_to_write_diff_ref,
    rollback_or_abort_plan_ref: row.rollback_or_abort_plan_ref,
    operator_approval_ref: row.operator_approval_ref,
    operator_actor_ref: row.operator_actor_ref,
    operator_approval_payload: JSON.parse(row.operator_approval_payload_json),
    accepted_evidence_ref_write_record_written: true,
    product_id_allocated: false,
    broad_product_persistence_executed: false,
    product_write_adapter_enabled: false,
    proof_created: false,
    evidence_created: false,
    claim_evidence_written: false,
    work_item_created: false,
    promotion_executed: false,
    formation_receipt_written_now: false,
    durable_perspective_state_mutated: false,
    accepted_evidence_ref_write_is_truth: false,
    accepted_evidence_ref_write_is_proof: false,
    accepted_evidence_ref_write_is_durable_perspective_state: false,
    accepted_evidence_ref_write_is_product_id_allocation: false,
    operator_approval_is_proof: false,
    preview_to_write_diff_is_write_approval: false,
    source_refs_are_lineage_pointers: true,
    promotion_decision_is_prerequisite_not_command: true,
    formation_receipt_is_prerequisite_not_product_write_authority: true,
    audit_event_is_product_authority: false,
    reason_codes: parseReasonCodes(row.reason_codes_json),
    boundary_notes: parseStringArray(row.boundary_notes_json),
    authority_boundary: JSON.parse(row.authority_boundary_json),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function parseStringArray(value: string): string[] {
  const parsed = JSON.parse(value) as unknown;
  return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
}

function parseReasonCodes(value: string): ProductWriteAcceptedEvidenceRefReasonCode[] {
  const parsed = parseStringArray(value);
  return parsed as ProductWriteAcceptedEvidenceRefReasonCode[];
}
