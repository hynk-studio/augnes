import type {
  DogfoodingRecord,
  DogfoodingRecordAuthorityBoundary,
  DogfoodingRecordReasonCode,
  DogfoodingReviewCue,
  DogfoodingSignal,
} from "../../types/dogfooding-record-runtime-contract";

export const dogfoodingRecordStoreSchemaSqlV01 = `
CREATE TABLE IF NOT EXISTS dogfooding_records (
  record_id text primary key,
  scope text not null,
  status text not null,
  operator_actor_ref text not null,
  recorded_at text not null,
  bounded_context_summary text not null,
  privacy_class text not null,
  redaction_status text not null,
  public_safe integer not null,
  boundary_notes_json text not null,
  reason_codes_json text not null,
  authority_boundary_json text not null,
  record_fingerprint text not null,
  created_at text not null
);

CREATE TABLE IF NOT EXISTS dogfooding_signals (
  signal_id text primary key,
  record_id text not null,
  signal_kind text not null,
  surface text not null,
  surface_ref text not null,
  severity text not null,
  bounded_summary text not null,
  refs_json text not null,
  privacy_class text not null,
  redaction_status text not null,
  public_safe integer not null,
  reason_codes_json text not null,
  authority_boundary_json text not null,
  foreign key (record_id) references dogfooding_records(record_id) on delete cascade
);

CREATE TABLE IF NOT EXISTS dogfooding_review_cues (
  review_cue_id text primary key,
  record_id text not null,
  cue_kind text not null,
  target_surface text not null,
  target_surface_ref text not null,
  target_signal_refs_json text not null,
  bounded_summary text not null,
  severity text not null,
  candidate_only integer not null,
  product_write_request_only integer not null,
  product_write_executed integer not null,
  reason_codes_json text not null,
  authority_boundary_json text not null,
  foreign key (record_id) references dogfooding_records(record_id) on delete cascade
);

CREATE INDEX IF NOT EXISTS idx_dogfooding_records_status
  ON dogfooding_records(scope, status, recorded_at, record_id);
CREATE INDEX IF NOT EXISTS idx_dogfooding_records_operator
  ON dogfooding_records(scope, operator_actor_ref, recorded_at, record_id);
CREATE INDEX IF NOT EXISTS idx_dogfooding_signals_record
  ON dogfooding_signals(record_id, signal_id);
CREATE INDEX IF NOT EXISTS idx_dogfooding_review_cues_record
  ON dogfooding_review_cues(record_id, review_cue_id);
`;

const scope = "project:augnes" as const;
const requiredTables = [
  "dogfooding_records",
  "dogfooding_signals",
  "dogfooding_review_cues",
] as const;

type DogfoodingDbStatement = {
  run: (...params: any[]) => unknown;
  get: (...params: any[]) => unknown;
  all: (...params: any[]) => unknown[];
};

export type DogfoodingDbLike = {
  exec: (sql: string) => unknown;
  prepare: (sql: string) => DogfoodingDbStatement;
};

export type DogfoodingRecordStoreStatus =
  | "created"
  | "duplicate_record"
  | "not_found"
  | "schema_missing"
  | "blocked_invalid_input"
  | "blocked_private_or_raw_payload";

export interface DogfoodingRecordStoreResult {
  ok: boolean;
  status: DogfoodingRecordStoreStatus;
  record: DogfoodingRecord | null;
  records: DogfoodingRecord[];
  error_code: string | null;
  durable_state_mutated: false;
  candidate_mutated: false;
  proof_or_evidence_created: false;
  claim_or_evidence_written: false;
  product_write_executed: false;
}

export interface DogfoodingRecordListFilters {
  status?: string;
  operator_actor_ref?: string;
  include_blocked?: boolean;
  limit?: number;
}

type RecordRow = {
  record_id: string;
  scope: string;
  status: DogfoodingRecord["status"];
  operator_actor_ref: string;
  recorded_at: string;
  bounded_context_summary: string;
  privacy_class: DogfoodingRecord["privacy_class"];
  redaction_status: DogfoodingRecord["redaction_status"];
  public_safe: number;
  boundary_notes_json: string;
  reason_codes_json: string;
  authority_boundary_json: string;
  record_fingerprint: string;
};

type SignalRow = {
  signal_id: string;
  record_id: string;
  signal_kind: DogfoodingSignal["signal_kind"];
  surface: DogfoodingSignal["surface"];
  surface_ref: string;
  severity: DogfoodingSignal["severity"];
  bounded_summary: string;
  refs_json: string;
  privacy_class: DogfoodingSignal["privacy_class"];
  redaction_status: DogfoodingSignal["redaction_status"];
  public_safe: number;
  reason_codes_json: string;
  authority_boundary_json: string;
};

type ReviewCueRow = {
  review_cue_id: string;
  record_id: string;
  cue_kind: DogfoodingReviewCue["cue_kind"];
  target_surface: DogfoodingReviewCue["target_surface"];
  target_surface_ref: string;
  target_signal_refs_json: string;
  bounded_summary: string;
  severity: DogfoodingReviewCue["severity"];
  candidate_only: number;
  product_write_request_only: number;
  product_write_executed: number;
  reason_codes_json: string;
  authority_boundary_json: string;
};

interface SignalRefsJson {
  source_refs: string[];
  feedback_refs: string[];
  surfacing_preview_refs: string[];
  manual_anchor_refs: string[];
  promotion_decision_refs: string[];
  formation_receipt_refs: string[];
  durable_state_refs: string[];
  trajectory_refs: string[];
}

const privateMarkers = [
  "/Users/",
  "/home/",
  "file://",
  "sk-",
  "ghp_",
  "OPENAI_API_KEY",
  "GITHUB_TOKEN",
  "password:",
  "secret:",
  "private key",
  "raw provider output",
  "raw retrieval output",
  "raw feedback payload",
  "raw surfacing payload",
  "raw dogfooding payload",
  "raw conversation",
  "hidden reasoning",
  "telemetry dump",
] as const;

export function ensureDogfoodingRecordStoreSchemaV01(db: DogfoodingDbLike): void {
  db.exec(dogfoodingRecordStoreSchemaSqlV01);
}

export function dogfoodingRecordStoreSchemaExistsV01(db: DogfoodingDbLike): boolean {
  const rows = db
    .prepare(
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name IN (?, ?, ?)`,
    )
    .all(...requiredTables) as { name: string }[];
  const tableNames = new Set(rows.map((row) => row.name));
  return requiredTables.every((tableName) => tableNames.has(tableName));
}

export function createDogfoodingRecordV01(
  record: DogfoodingRecord,
  db: DogfoodingDbLike,
): DogfoodingRecordStoreResult {
  if (!dogfoodingRecordStoreSchemaExistsV01(db)) return storeResult("schema_missing");
  if (!record || record.scope !== scope || hasUnsafeRecord(record)) {
    return storeResult("blocked_private_or_raw_payload");
  }
  if (readRecordRow(db, record.record_id)) {
    return storeResult("duplicate_record");
  }

  let transactionStarted = false;
  try {
    db.prepare("BEGIN IMMEDIATE").run();
    transactionStarted = true;
    insertRecord(db, record);
    for (const signal of record.signals) insertSignal(db, record.record_id, signal);
    for (const cue of record.review_cues) insertReviewCue(db, record.record_id, cue);
    db.prepare("COMMIT").run();
    transactionStarted = false;
    return storeResult("created", record, [record]);
  } catch {
    if (transactionStarted) {
      try {
        db.prepare("ROLLBACK").run();
      } catch {
        // Rollback failure still returns a bounded store error.
      }
    }
    return storeResult("blocked_invalid_input");
  }
}

export function readDogfoodingRecordV01(
  recordId: string,
  db: DogfoodingDbLike,
): DogfoodingRecordStoreResult {
  if (!isSafeString(recordId)) return storeResult("blocked_private_or_raw_payload");
  if (!dogfoodingRecordStoreSchemaExistsV01(db)) return storeResult("schema_missing");
  const row = readRecordRow(db, recordId);
  if (!row) return storeResult("not_found");
  const record = rowToRecord(row, readSignals(db, recordId), readReviewCues(db, recordId));
  return storeResult("created", record, [record]);
}

export function listDogfoodingRecordsV01(
  filters: DogfoodingRecordListFilters,
  db: DogfoodingDbLike,
): DogfoodingRecordStoreResult {
  if (!dogfoodingRecordStoreSchemaExistsV01(db)) return storeResult("schema_missing");
  if (filters.status && !isSafeString(filters.status)) {
    return storeResult("blocked_private_or_raw_payload");
  }
  if (filters.operator_actor_ref && !isSafeString(filters.operator_actor_ref)) {
    return storeResult("blocked_private_or_raw_payload");
  }

  const clauses = ["scope = ?"];
  const params: unknown[] = [scope];
  if (filters.status) {
    clauses.push("status = ?");
    params.push(filters.status);
  }
  if (filters.operator_actor_ref) {
    clauses.push("operator_actor_ref = ?");
    params.push(filters.operator_actor_ref);
  }
  if (!filters.include_blocked) clauses.push("status NOT LIKE 'blocked_%'");
  const limit = Math.max(1, Math.min(filters.limit ?? 50, 100));
  params.push(limit);

  const rows = db
    .prepare(
      `SELECT * FROM dogfooding_records
       WHERE ${clauses.join(" AND ")}
       ORDER BY recorded_at ASC, record_id ASC
       LIMIT ?`,
    )
    .all(...params) as RecordRow[];
  const records = rows.map((row) =>
    rowToRecord(row, readSignals(db, row.record_id), readReviewCues(db, row.record_id)),
  );
  return storeResult("created", records[0] ?? null, records);
}

function insertRecord(db: DogfoodingDbLike, record: DogfoodingRecord): void {
  db.prepare(
    `INSERT INTO dogfooding_records (
      record_id,
      scope,
      status,
      operator_actor_ref,
      recorded_at,
      bounded_context_summary,
      privacy_class,
      redaction_status,
      public_safe,
      boundary_notes_json,
      reason_codes_json,
      authority_boundary_json,
      record_fingerprint,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    record.record_id,
    record.scope,
    record.status,
    record.operator_actor_ref,
    record.recorded_at,
    record.bounded_context_summary,
    record.privacy_class,
    record.redaction_status,
    boolToInt(record.public_safe),
    JSON.stringify(record.boundary_notes),
    JSON.stringify(record.reason_codes),
    JSON.stringify(record.authority_boundary),
    record.record_fingerprint,
    record.recorded_at,
  );
}

function insertSignal(
  db: DogfoodingDbLike,
  recordId: string,
  signal: DogfoodingSignal,
): void {
  const refs: SignalRefsJson = {
    source_refs: signal.source_refs,
    feedback_refs: signal.feedback_refs,
    surfacing_preview_refs: signal.surfacing_preview_refs,
    manual_anchor_refs: signal.manual_anchor_refs,
    promotion_decision_refs: signal.promotion_decision_refs,
    formation_receipt_refs: signal.formation_receipt_refs,
    durable_state_refs: signal.durable_state_refs,
    trajectory_refs: signal.trajectory_refs,
  };
  db.prepare(
    `INSERT INTO dogfooding_signals (
      signal_id,
      record_id,
      signal_kind,
      surface,
      surface_ref,
      severity,
      bounded_summary,
      refs_json,
      privacy_class,
      redaction_status,
      public_safe,
      reason_codes_json,
      authority_boundary_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    signal.signal_id,
    recordId,
    signal.signal_kind,
    signal.surface,
    signal.surface_ref,
    signal.severity,
    signal.bounded_summary,
    JSON.stringify(refs),
    signal.privacy_class,
    signal.redaction_status,
    boolToInt(signal.public_safe),
    JSON.stringify(signal.reason_codes),
    JSON.stringify(signal.authority_boundary),
  );
}

function insertReviewCue(
  db: DogfoodingDbLike,
  recordId: string,
  cue: DogfoodingReviewCue,
): void {
  db.prepare(
    `INSERT INTO dogfooding_review_cues (
      review_cue_id,
      record_id,
      cue_kind,
      target_surface,
      target_surface_ref,
      target_signal_refs_json,
      bounded_summary,
      severity,
      candidate_only,
      product_write_request_only,
      product_write_executed,
      reason_codes_json,
      authority_boundary_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    cue.review_cue_id,
    recordId,
    cue.cue_kind,
    cue.target_surface,
    cue.target_surface_ref,
    JSON.stringify(cue.target_signal_refs),
    cue.bounded_summary,
    cue.severity,
    boolToInt(cue.candidate_only),
    boolToInt(cue.product_write_request_only),
    boolToInt(cue.product_write_executed),
    JSON.stringify(cue.reason_codes),
    JSON.stringify(cue.authority_boundary),
  );
}

function readRecordRow(db: DogfoodingDbLike, recordId: string): RecordRow | null {
  return (
    (db
      .prepare(`SELECT * FROM dogfooding_records WHERE record_id = ?`)
      .get(recordId) as RecordRow | undefined) ?? null
  );
}

function readSignals(db: DogfoodingDbLike, recordId: string): DogfoodingSignal[] {
  const rows = db
    .prepare(
      `SELECT * FROM dogfooding_signals
       WHERE record_id = ?
       ORDER BY signal_id ASC`,
    )
    .all(recordId) as SignalRow[];
  return rows.map(rowToSignal);
}

function readReviewCues(db: DogfoodingDbLike, recordId: string): DogfoodingReviewCue[] {
  const rows = db
    .prepare(
      `SELECT * FROM dogfooding_review_cues
       WHERE record_id = ?
       ORDER BY review_cue_id ASC`,
    )
    .all(recordId) as ReviewCueRow[];
  return rows.map(rowToReviewCue);
}

function rowToRecord(
  row: RecordRow,
  signals: DogfoodingSignal[],
  reviewCues: DogfoodingReviewCue[],
): DogfoodingRecord {
  return {
    record_version: "dogfooding_record.v0.1",
    contract_version: "dogfooding_record_runtime_contract.v0.1",
    scope,
    status: row.status,
    record_id: row.record_id,
    operator_actor_ref: row.operator_actor_ref,
    recorded_at: row.recorded_at,
    bounded_context_summary: row.bounded_context_summary,
    signals,
    review_cues: reviewCues,
    privacy_class: row.privacy_class,
    redaction_status: row.redaction_status,
    public_safe: row.public_safe === 1,
    boundary_notes: parseStringArray(row.boundary_notes_json),
    reason_codes: parseReasonCodes(row.reason_codes_json),
    authority_boundary: parseAuthorityBoundary(row.authority_boundary_json),
    record_fingerprint: row.record_fingerprint,
  };
}

function rowToSignal(row: SignalRow): DogfoodingSignal {
  const refs = parseSignalRefs(row.refs_json);
  return {
    signal_version: "dogfooding_signal.v0.1",
    scope,
    signal_id: row.signal_id,
    signal_kind: row.signal_kind,
    surface: row.surface,
    surface_ref: row.surface_ref,
    severity: row.severity,
    bounded_summary: row.bounded_summary,
    source_refs: refs.source_refs,
    feedback_refs: refs.feedback_refs,
    surfacing_preview_refs: refs.surfacing_preview_refs,
    manual_anchor_refs: refs.manual_anchor_refs,
    promotion_decision_refs: refs.promotion_decision_refs,
    formation_receipt_refs: refs.formation_receipt_refs,
    durable_state_refs: refs.durable_state_refs,
    trajectory_refs: refs.trajectory_refs,
    privacy_class: row.privacy_class,
    redaction_status: row.redaction_status,
    public_safe: row.public_safe === 1,
    reason_codes: parseReasonCodes(row.reason_codes_json),
    authority_boundary: parseAuthorityBoundary(row.authority_boundary_json),
  };
}

function rowToReviewCue(row: ReviewCueRow): DogfoodingReviewCue {
  return {
    review_cue_version: "dogfooding_review_cue.v0.1",
    scope,
    review_cue_id: row.review_cue_id,
    cue_kind: row.cue_kind,
    target_surface: row.target_surface,
    target_surface_ref: row.target_surface_ref,
    target_signal_refs: parseStringArray(row.target_signal_refs_json),
    bounded_summary: row.bounded_summary,
    severity: row.severity,
    candidate_only: true,
    product_write_request_only: row.product_write_request_only === 1,
    product_write_executed: false,
    reason_codes: parseReasonCodes(row.reason_codes_json),
    authority_boundary: parseAuthorityBoundary(row.authority_boundary_json),
  };
}

function storeResult(
  status: DogfoodingRecordStoreStatus,
  record: DogfoodingRecord | null = null,
  records: DogfoodingRecord[] = [],
): DogfoodingRecordStoreResult {
  return {
    ok: status === "created",
    status,
    record,
    records,
    error_code: status === "created" ? null : status,
    durable_state_mutated: false,
    candidate_mutated: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    product_write_executed: false,
  };
}

function hasUnsafeRecord(record: DogfoodingRecord): boolean {
  return privateMarkers.some((marker) => JSON.stringify(record).includes(marker));
}

function isSafeString(value: string): boolean {
  return (
    value.trim().length > 0 &&
    !privateMarkers.some((marker) => value.includes(marker)) &&
    !value.includes("http://") &&
    !value.includes("https://")
  );
}

function boolToInt(value: boolean): number {
  return value ? 1 : 0;
}

function parseSignalRefs(value: string): SignalRefsJson {
  const parsed = parseJsonRecord(value);
  return {
    source_refs: parseUnknownStringArray(parsed.source_refs),
    feedback_refs: parseUnknownStringArray(parsed.feedback_refs),
    surfacing_preview_refs: parseUnknownStringArray(parsed.surfacing_preview_refs),
    manual_anchor_refs: parseUnknownStringArray(parsed.manual_anchor_refs),
    promotion_decision_refs: parseUnknownStringArray(parsed.promotion_decision_refs),
    formation_receipt_refs: parseUnknownStringArray(parsed.formation_receipt_refs),
    durable_state_refs: parseUnknownStringArray(parsed.durable_state_refs),
    trajectory_refs: parseUnknownStringArray(parsed.trajectory_refs),
  };
}

function parseStringArray(value: string): string[] {
  return parseUnknownStringArray(parseJson(value));
}

function parseReasonCodes(value: string): DogfoodingRecordReasonCode[] {
  return parseStringArray(value) as DogfoodingRecordReasonCode[];
}

function parseAuthorityBoundary(value: string): DogfoodingRecordAuthorityBoundary {
  return parseJsonRecord(value) as unknown as DogfoodingRecordAuthorityBoundary;
}

function parseUnknownStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function parseJsonRecord(value: string): Record<string, unknown> {
  const parsed = parseJson(value);
  return parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>)
    : {};
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
