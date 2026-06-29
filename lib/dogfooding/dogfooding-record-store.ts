import { createHash } from "node:crypto";

import type {
  DogfoodingRecord,
  DogfoodingRecordAuthorityBoundary,
  DogfoodingRecordReasonCode,
  DogfoodingReviewCue,
  DogfoodingSignal,
} from "../../types/dogfooding-record-runtime-contract";
import type {
  DogfoodingResearchRecord,
  DogfoodingResearchRecordAuthorityBoundary,
  DogfoodingResearchRecordInput,
  DogfoodingResearchRecordKind,
  DogfoodingResearchRecordListFilters,
  DogfoodingResearchRecordPrivacyFinding,
  DogfoodingResearchRecordPrivacyReport,
  DogfoodingResearchRecordReasonCode,
  DogfoodingResearchRecordReviewCue,
  DogfoodingResearchRecordReviewCueKind,
  DogfoodingResearchRecordStoreResult,
  DogfoodingResearchRecordStoreStatus,
} from "../../types/dogfooding-research-record-runtime-contract";

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
  return hasPrivateMarker(JSON.stringify(record));
}

function isSafeString(value: string): boolean {
  const normalizedValue = value.toLowerCase();
  return (
    value.trim().length > 0 &&
    !privateMarkers.some((marker) => normalizedValue.includes(marker.toLowerCase())) &&
    !normalizedValue.includes("http://") &&
    !normalizedValue.includes("https://")
  );
}

function hasPrivateMarker(value: string): boolean {
  const normalizedValue = value.toLowerCase();
  return privateMarkers.some((marker) => normalizedValue.includes(marker.toLowerCase()));
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

export const dogfoodingResearchRecordStoreSchemaSqlV01 = `
CREATE TABLE IF NOT EXISTS dogfooding_research_records (
  record_id text primary key,
  record_version text not null,
  runtime_version text not null,
  store_version text not null,
  scope text not null,
  record_kind text not null,
  created_at text not null,
  updated_at text not null,
  operator_actor_ref text not null,
  source_refs_json text not null,
  pr_refs_json text not null,
  branch_refs_json text not null,
  commit_refs_json text not null,
  changed_file_refs_json text not null,
  validation_refs_json text not null,
  skipped_check_refs_json text not null,
  known_warning_refs_json text not null,
  not_done_refs_json text not null,
  expected_observed_delta_refs_json text not null,
  normalized_summary text not null,
  review_cues_json text not null,
  privacy_report_json text not null,
  authority_boundary_json text not null,
  reason_codes_json text not null,
  lifecycle_state text not null,
  record_fingerprint text not null
);

CREATE INDEX IF NOT EXISTS idx_dogfooding_research_records_kind
  ON dogfooding_research_records(scope, record_kind, created_at, record_id);
CREATE INDEX IF NOT EXISTS idx_dogfooding_research_records_operator
  ON dogfooding_research_records(scope, operator_actor_ref, created_at, record_id);
`;

const dogfoodingResearchRecordInputVersion =
  "dogfooding_research_record_input.v0.1" as const;
const dogfoodingResearchRecordRuntimeVersion =
  "dogfooding_research_record_runtime.v0.1" as const;
const dogfoodingResearchRecordVersion =
  "dogfooding_research_record.v0.1" as const;
const dogfoodingResearchRecordStoreVersion =
  "dogfooding_research_record_store.v0.1" as const;
const dogfoodingResearchRecordScope = "project:augnes" as const;
const codexResultReportAlignmentRef = "codex_result_report_ingestion_v0_1" as const;
const dogfoodingResearchRecordKinds = [
  "pr_body_summary",
  "codex_result_report",
  "changed_files_summary",
  "validation_command_report",
  "smoke_failure_report",
  "skipped_check_report",
  "known_warning_report",
  "not_done_report",
  "expected_observed_delta_report",
  "operator_review_note",
  "merge_closeout_summary",
] as const satisfies readonly DogfoodingResearchRecordKind[];
const researchRequiredTables = ["dogfooding_research_records"] as const;
const researchArrayFields = [
  "source_refs",
  "pr_refs",
  "branch_refs",
  "commit_refs",
  "changed_file_refs",
  "validation_refs",
  "skipped_check_refs",
  "known_warning_refs",
  "not_done_refs",
  "expected_observed_delta_refs",
  "review_cues",
  "boundary_notes",
] as const;
const researchForbiddenAuthorityFields = [
  "ui_now",
  "component_now",
  "cockpit_change_now",
  "public_surface_change_now",
  "route_model_change_now",
  "provider_openai_call_now",
  "prompt_sent_now",
  "source_fetch_now",
  "retrieval_execution_now",
  "retrieval_index_write_now",
  "proof_or_evidence_record_now",
  "claim_or_evidence_write_now",
  "promotion_execution_now",
  "promotion_decision_record_write_now",
  "formation_receipt_write_now",
  "durable_state_write_now",
  "durable_state_apply_now",
  "review_memory_write_now",
  "product_write_now",
  "product_id_allocation_now",
  "codex_execution_from_augnes_runtime_now",
  "github_api_call_now",
  "git_write_now",
  "github_git_actuation_now",
  "release_deploy_publish_now",
  "record_is_truth",
  "record_is_proof",
  "record_is_approval",
  "pr_body_is_truth",
  "changed_files_are_proof",
  "validation_pass_is_approval",
  "validation_failure_is_rejection",
  "smoke_pass_is_evidence",
  "smoke_failure_is_rejection",
  "ci_pass_is_authority",
  "ci_failure_is_rejection",
  "codex_result_is_execution_approval",
  "git_ref_is_authority",
  "github_pr_ref_is_authority",
  "dogfooding_record_is_review_memory_write",
  "dogfooding_record_is_promotion",
  "dogfooding_record_is_formation_receipt",
  "dogfooding_record_is_durable_perspective_state",
  "dogfooding_record_is_product_write",
] as const;
const researchAllowedTrueAuthorityFields = [
  "dogfooding_research_record_runtime_now",
  "same_origin_route_now",
  "local_test_db_query_or_write_now",
  "operator_supplied_payload_only",
  "caller_injected_local_db_only",
  "candidate_only",
  "public_safe_summary_only",
] as const;
const researchBlockedAuthorityPhraseParts = [
  ["candidate", "proof"],
  ["candidate", "fact"],
  ["provider output", "truth"],
  ["provider output", "proof"],
  ["retrieval result", "evidence"],
  ["retrieval result", "authority"],
  ["retrieval score", "truth score"],
  ["pr body", "authority"],
  ["ci pass", "truth"],
  ["ci pass", "approval"],
  ["smoke pass", "truth"],
  ["smoke pass", "evidence"],
  ["git ref", "authority"],
  ["github pr", "core decision"],
] as const;

type DogfoodingResearchRecordRow = Omit<
  DogfoodingResearchRecord,
  | "source_refs"
  | "pr_refs"
  | "branch_refs"
  | "commit_refs"
  | "changed_file_refs"
  | "validation_refs"
  | "skipped_check_refs"
  | "known_warning_refs"
  | "not_done_refs"
  | "expected_observed_delta_refs"
  | "review_cues"
  | "privacy_report"
  | "authority_boundary"
  | "reason_codes"
> & {
  source_refs_json: string;
  pr_refs_json: string;
  branch_refs_json: string;
  commit_refs_json: string;
  changed_file_refs_json: string;
  validation_refs_json: string;
  skipped_check_refs_json: string;
  known_warning_refs_json: string;
  not_done_refs_json: string;
  expected_observed_delta_refs_json: string;
  review_cues_json: string;
  privacy_report_json: string;
  authority_boundary_json: string;
  reason_codes_json: string;
};

type ResearchJsonRecord = Record<string, unknown>;
type ResearchFindingDraft = Omit<DogfoodingResearchRecordPrivacyFinding, "finding_id">;

export function ensureDogfoodingResearchRecordStoreSchemaV01(
  db: DogfoodingDbLike,
): void {
  db.exec(dogfoodingResearchRecordStoreSchemaSqlV01);
}

export function dogfoodingResearchRecordStoreSchemaExistsV01(
  db: DogfoodingDbLike,
): boolean {
  const rows = db
    .prepare(
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name IN (?)`,
    )
    .all(...researchRequiredTables) as { name: string }[];
  const tableNames = new Set(rows.map((row) => row.name));
  return researchRequiredTables.every((tableName) => tableNames.has(tableName));
}

export function createDogfoodingResearchRecordAuthorityBoundaryV01():
  DogfoodingResearchRecordAuthorityBoundary {
  return {
    dogfooding_research_record_runtime_now: true,
    same_origin_route_now: true,
    local_test_db_query_or_write_now: true,
    operator_supplied_payload_only: true,
    caller_injected_local_db_only: true,
    candidate_only: true,
    public_safe_summary_only: true,
    ui_now: false,
    component_now: false,
    cockpit_change_now: false,
    public_surface_change_now: false,
    route_model_change_now: false,
    provider_openai_call_now: false,
    prompt_sent_now: false,
    source_fetch_now: false,
    retrieval_execution_now: false,
    retrieval_index_write_now: false,
    proof_or_evidence_record_now: false,
    claim_or_evidence_write_now: false,
    promotion_execution_now: false,
    promotion_decision_record_write_now: false,
    formation_receipt_write_now: false,
    durable_state_write_now: false,
    durable_state_apply_now: false,
    review_memory_write_now: false,
    product_write_now: false,
    product_id_allocation_now: false,
    codex_execution_from_augnes_runtime_now: false,
    github_api_call_now: false,
    git_write_now: false,
    github_git_actuation_now: false,
    release_deploy_publish_now: false,
    record_is_truth: false,
    record_is_proof: false,
    record_is_approval: false,
    pr_body_is_truth: false,
    changed_files_are_proof: false,
    validation_pass_is_approval: false,
    validation_failure_is_rejection: false,
    smoke_pass_is_evidence: false,
    smoke_failure_is_rejection: false,
    ci_pass_is_authority: false,
    ci_failure_is_rejection: false,
    codex_result_is_execution_approval: false,
    git_ref_is_authority: false,
    github_pr_ref_is_authority: false,
    dogfooding_record_is_review_memory_write: false,
    dogfooding_record_is_promotion: false,
    dogfooding_record_is_formation_receipt: false,
    dogfooding_record_is_durable_perspective_state: false,
    dogfooding_record_is_product_write: false,
  };
}

export function buildDogfoodingResearchRecordV01(
  input: unknown,
): DogfoodingResearchRecordStoreResult {
  const privacyReport = buildDogfoodingResearchRecordPrivacyReportV01(input);
  if (!isResearchRecord(input)) {
    return researchStoreResult("rejected", null, [], privacyReport);
  }
  const candidateInput = input as unknown as DogfoodingResearchRecordInput;
  const malformedPaths = validateDogfoodingResearchRecordShapeV01(candidateInput);
  if (privacyReport.status !== "passed") {
    return researchStoreResult(privacyReport.status, null, [], privacyReport);
  }
  if (malformedPaths.length > 0) {
    return researchStoreResult("rejected", null, [], {
      ...privacyReport,
      status: "rejected",
      findings: finalizeResearchFindings([
        ...privacyReport.findings,
        ...malformedPaths.map(
          (path): ResearchFindingDraft => ({
            path,
            finding_kind: "invalid_shape",
            action: "blocked",
            reason_codes: ["invalid_shape_blocked", "public_safe_summary_only"],
            public_safe_summary: "Invalid dogfooding research record shape was blocked.",
            original_value_included: false,
          }),
        ),
      ]),
      blocked_paths: uniqueSortedResearch([
        ...privacyReport.blocked_paths,
        ...malformedPaths,
      ]),
      reason_codes: uniqueSortedResearch([
        ...privacyReport.reason_codes,
        "invalid_shape_blocked",
        "public_safe_summary_only",
      ]),
    });
  }

  const normalizedInput = applyCodexResultReportAlignment(candidateInput);
  const recordWithoutFingerprint: Omit<DogfoodingResearchRecord, "record_fingerprint"> = {
    record_version: dogfoodingResearchRecordVersion,
    runtime_version: dogfoodingResearchRecordRuntimeVersion,
    store_version: dogfoodingResearchRecordStoreVersion,
    scope: dogfoodingResearchRecordScope,
    record_id: normalizedInput.record_id,
    record_kind: normalizedInput.record_kind,
    created_at: normalizedInput.created_at,
    updated_at: normalizedInput.updated_at ?? normalizedInput.created_at,
    operator_actor_ref: normalizedInput.operator_actor_ref,
    source_refs: normalizeResearchRefs(normalizedInput.source_refs),
    pr_refs: normalizeResearchRefs(normalizedInput.pr_refs),
    branch_refs: normalizeResearchRefs(normalizedInput.branch_refs),
    commit_refs: normalizeResearchRefs(normalizedInput.commit_refs),
    changed_file_refs: normalizeResearchRefs(normalizedInput.changed_file_refs),
    validation_refs: normalizeResearchRefs(normalizedInput.validation_refs),
    skipped_check_refs: normalizeResearchRefs(normalizedInput.skipped_check_refs),
    known_warning_refs: normalizeResearchRefs(normalizedInput.known_warning_refs),
    not_done_refs: normalizeResearchRefs(normalizedInput.not_done_refs),
    expected_observed_delta_refs: normalizeResearchRefs(
      normalizedInput.expected_observed_delta_refs,
    ),
    normalized_summary: sanitizeResearchSummary(normalizedInput.normalized_summary),
    review_cues: [],
    privacy_report: privacyReport,
    authority_boundary: createDogfoodingResearchRecordAuthorityBoundaryV01(),
    reason_codes: [],
    lifecycle_state: "candidate_only",
  };
  const reviewCues = buildDogfoodingResearchRecordReviewCuesV01(recordWithoutFingerprint);
  const reasonCodes = collectDogfoodingResearchRecordReasonCodesV01(
    recordWithoutFingerprint,
    reviewCues,
  );
  const completeWithoutFingerprint = {
    ...recordWithoutFingerprint,
    review_cues: reviewCues,
    reason_codes: reasonCodes,
  };
  const record: DogfoodingResearchRecord = {
    ...completeWithoutFingerprint,
    record_fingerprint:
      createDogfoodingResearchRecordFingerprintV01(completeWithoutFingerprint),
  };
  return researchStoreResult("created", record, [record], privacyReport);
}

export function createDogfoodingResearchRecordV01(
  input: unknown,
  db: DogfoodingDbLike,
): DogfoodingResearchRecordStoreResult {
  const built = buildDogfoodingResearchRecordV01(input);
  if (!built.ok || !built.record) return built;
  return createDogfoodingResearchRecordFromRecordV01(built.record, db);
}

export function createDogfoodingResearchRecordFromRecordV01(
  record: DogfoodingResearchRecord,
  db: DogfoodingDbLike,
): DogfoodingResearchRecordStoreResult {
  if (!dogfoodingResearchRecordStoreSchemaExistsV01(db)) {
    return researchStoreResult("schema_missing", null, [], record.privacy_report);
  }
  const existing = readDogfoodingResearchRecordRow(db, record.record_id);
  if (existing) {
    const existingRecord = researchRowToRecord(existing);
    if (existingRecord.record_fingerprint === record.record_fingerprint) {
      return researchStoreResult(
        "duplicate_record",
        existingRecord,
        [existingRecord],
        existingRecord.privacy_report,
        true,
      );
    }
    return researchStoreResult(
      "conflicting_record",
      existingRecord,
      [existingRecord],
      existingRecord.privacy_report,
    );
  }
  try {
    insertDogfoodingResearchRecord(db, record);
    return researchStoreResult("created", record, [record], record.privacy_report);
  } catch {
    return researchStoreResult("rejected", null, [], record.privacy_report);
  }
}

export function readDogfoodingResearchRecordV01(
  recordId: string,
  db: DogfoodingDbLike,
): DogfoodingResearchRecordStoreResult {
  if (!isSafeResearchString(recordId)) {
    return researchStoreResult(
      "blocked_private_or_raw_payload",
      null,
      [],
      baseDogfoodingResearchPrivacyReport("blocked_private_or_raw_payload", [
        {
          path: "record_id",
          finding_kind: "unsafe_record_id",
          action: "blocked",
          reason_codes: ["public_safe_summary_only", "raw_private_payload_blocked"],
          public_safe_summary: "Unsafe record id was blocked without raw value echo.",
          original_value_included: false,
        },
      ]),
    );
  }
  if (!dogfoodingResearchRecordStoreSchemaExistsV01(db)) {
    return researchStoreResult("schema_missing");
  }
  const row = readDogfoodingResearchRecordRow(db, recordId);
  if (!row) return researchStoreResult("not_found");
  const record = researchRowToRecord(row);
  return researchStoreResult("read", record, [record], record.privacy_report);
}

export function listDogfoodingResearchRecordsV01(
  filters: DogfoodingResearchRecordListFilters,
  db: DogfoodingDbLike,
): DogfoodingResearchRecordStoreResult {
  if (!dogfoodingResearchRecordStoreSchemaExistsV01(db)) {
    return researchStoreResult("schema_missing");
  }
  if (filters.record_kind && !isSafeResearchString(filters.record_kind)) {
    return researchStoreResult("blocked_private_or_raw_payload");
  }
  if (filters.operator_actor_ref && !isSafeResearchString(filters.operator_actor_ref)) {
    return researchStoreResult("blocked_private_or_raw_payload");
  }
  const clauses = ["scope = ?"];
  const params: unknown[] = [dogfoodingResearchRecordScope];
  if (filters.record_kind) {
    clauses.push("record_kind = ?");
    params.push(filters.record_kind);
  }
  if (filters.operator_actor_ref) {
    clauses.push("operator_actor_ref = ?");
    params.push(filters.operator_actor_ref);
  }
  const limit = Math.max(1, Math.min(filters.limit ?? 50, 100));
  params.push(limit);
  const rows = db
    .prepare(
      `SELECT * FROM dogfooding_research_records
       WHERE ${clauses.join(" AND ")}
       ORDER BY created_at ASC, record_id ASC
       LIMIT ?`,
    )
    .all(...params) as DogfoodingResearchRecordRow[];
  const records = rows.map(researchRowToRecord);
  return researchStoreResult("listed", records[0] ?? null, records);
}

export function createDogfoodingResearchRecordFingerprintV01(record: unknown): string {
  return `sha256:${createHash("sha256")
    .update(canonicalResearchJson(omitResearchFingerprint(record)))
    .digest("hex")}`;
}

function insertDogfoodingResearchRecord(
  db: DogfoodingDbLike,
  record: DogfoodingResearchRecord,
): void {
  db.prepare(
    `INSERT INTO dogfooding_research_records (
      record_id,
      record_version,
      runtime_version,
      store_version,
      scope,
      record_kind,
      created_at,
      updated_at,
      operator_actor_ref,
      source_refs_json,
      pr_refs_json,
      branch_refs_json,
      commit_refs_json,
      changed_file_refs_json,
      validation_refs_json,
      skipped_check_refs_json,
      known_warning_refs_json,
      not_done_refs_json,
      expected_observed_delta_refs_json,
      normalized_summary,
      review_cues_json,
      privacy_report_json,
      authority_boundary_json,
      reason_codes_json,
      lifecycle_state,
      record_fingerprint
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    record.record_id,
    record.record_version,
    record.runtime_version,
    record.store_version,
    record.scope,
    record.record_kind,
    record.created_at,
    record.updated_at,
    record.operator_actor_ref,
    JSON.stringify(record.source_refs),
    JSON.stringify(record.pr_refs),
    JSON.stringify(record.branch_refs),
    JSON.stringify(record.commit_refs),
    JSON.stringify(record.changed_file_refs),
    JSON.stringify(record.validation_refs),
    JSON.stringify(record.skipped_check_refs),
    JSON.stringify(record.known_warning_refs),
    JSON.stringify(record.not_done_refs),
    JSON.stringify(record.expected_observed_delta_refs),
    record.normalized_summary,
    JSON.stringify(record.review_cues),
    JSON.stringify(record.privacy_report),
    JSON.stringify(record.authority_boundary),
    JSON.stringify(record.reason_codes),
    record.lifecycle_state,
    record.record_fingerprint,
  );
}

function readDogfoodingResearchRecordRow(
  db: DogfoodingDbLike,
  recordId: string,
): DogfoodingResearchRecordRow | null {
  return (
    (db
      .prepare(`SELECT * FROM dogfooding_research_records WHERE record_id = ?`)
      .get(recordId) as DogfoodingResearchRecordRow | undefined) ?? null
  );
}

function researchRowToRecord(row: DogfoodingResearchRecordRow): DogfoodingResearchRecord {
  return {
    record_version: row.record_version,
    runtime_version: row.runtime_version,
    store_version: row.store_version,
    scope: row.scope,
    record_id: row.record_id,
    record_kind: row.record_kind,
    created_at: row.created_at,
    updated_at: row.updated_at,
    operator_actor_ref: row.operator_actor_ref,
    source_refs: parseResearchStringArray(row.source_refs_json),
    pr_refs: parseResearchStringArray(row.pr_refs_json),
    branch_refs: parseResearchStringArray(row.branch_refs_json),
    commit_refs: parseResearchStringArray(row.commit_refs_json),
    changed_file_refs: parseResearchStringArray(row.changed_file_refs_json),
    validation_refs: parseResearchStringArray(row.validation_refs_json),
    skipped_check_refs: parseResearchStringArray(row.skipped_check_refs_json),
    known_warning_refs: parseResearchStringArray(row.known_warning_refs_json),
    not_done_refs: parseResearchStringArray(row.not_done_refs_json),
    expected_observed_delta_refs: parseResearchStringArray(
      row.expected_observed_delta_refs_json,
    ),
    normalized_summary: row.normalized_summary,
    review_cues: parseResearchReviewCues(row.review_cues_json),
    privacy_report: parseResearchPrivacyReport(row.privacy_report_json),
    authority_boundary: parseResearchAuthorityBoundary(row.authority_boundary_json),
    reason_codes: parseResearchReasonCodes(row.reason_codes_json),
    lifecycle_state: "candidate_only",
    record_fingerprint: row.record_fingerprint,
  };
}

function validateDogfoodingResearchRecordShapeV01(
  input: DogfoodingResearchRecordInput,
): string[] {
  const failures: string[] = [];
  if (input.input_version !== dogfoodingResearchRecordInputVersion) {
    failures.push("input.input_version");
  }
  if (input.scope !== dogfoodingResearchRecordScope) failures.push("input.scope");
  if (!isSafeResearchString(input.record_id)) failures.push("input.record_id");
  if (!dogfoodingResearchRecordKinds.includes(input.record_kind)) {
    failures.push("input.record_kind");
  }
  if (!isSafeResearchString(input.created_at)) failures.push("input.created_at");
  if (input.updated_at !== undefined && !isSafeResearchString(input.updated_at)) {
    failures.push("input.updated_at");
  }
  if (!isSafeResearchString(input.operator_actor_ref)) {
    failures.push("input.operator_actor_ref");
  }
  if (!hasResearchSummary(input.normalized_summary)) {
    failures.push("input.normalized_summary");
  }
  for (const field of researchArrayFields) {
    const value = input[field];
    if (value !== undefined && !Array.isArray(value)) {
      failures.push(`input.${field}`);
    }
  }
  if (input.codex_result_report_input !== undefined) {
    if (input.record_kind !== "codex_result_report") {
      failures.push("input.codex_result_report_input.record_kind");
    }
    if (!isResearchRecord(input.codex_result_report_input)) {
      failures.push("input.codex_result_report_input");
    }
  }
  return uniqueSortedResearch(failures);
}

function applyCodexResultReportAlignment(
  input: DogfoodingResearchRecordInput,
): DogfoodingResearchRecordInput {
  if (
    input.record_kind !== "codex_result_report" ||
    input.codex_result_report_input === undefined
  ) {
    return input;
  }
  if (!isResearchRecord(input.codex_result_report_input)) return input;
  const codexInput = input.codex_result_report_input;
  const observedCheckRefs = [
    ...normalizeResearchArrayInput(codexInput.validation_commands),
    ...normalizeResearchArrayInput(codexInput.observed_checks),
  ];
  return {
    ...input,
    source_refs: mergeResearchRefs(input.source_refs, [
      codexResultReportAlignmentRef,
      ...normalizeResearchArrayInput(codexInput.source_refs),
    ]),
    pr_refs: mergeResearchRefs(input.pr_refs, normalizeResearchArrayInput(codexInput.pr_refs)),
    branch_refs: mergeResearchRefs(input.branch_refs, [
      ...normalizeResearchArrayInput(codexInput.branch_ref),
      ...normalizeResearchArrayInput(codexInput.branch_refs),
    ]),
    commit_refs: mergeResearchRefs(
      input.commit_refs,
      normalizeResearchArrayInput(codexInput.commit_refs),
    ),
    changed_file_refs: mergeResearchRefs(
      input.changed_file_refs,
      [
        ...normalizeResearchArrayInput(codexInput.changed_files_summary),
        ...normalizeResearchArrayInput(codexInput.observed_files),
      ],
    ),
    validation_refs: mergeResearchRefs(input.validation_refs, observedCheckRefs),
    skipped_check_refs: mergeResearchRefs(
      input.skipped_check_refs,
      normalizeResearchArrayInput(codexInput.skipped_checks),
    ),
    known_warning_refs: mergeResearchRefs(
      input.known_warning_refs,
      normalizeResearchArrayInput(codexInput.known_warnings),
    ),
    not_done_refs: mergeResearchRefs(
      input.not_done_refs,
      normalizeResearchArrayInput(codexInput.not_done_items),
    ),
    expected_observed_delta_refs: mergeResearchRefs(
      input.expected_observed_delta_refs,
      [
        ...normalizeResearchArrayInput(codexInput.expected_observed_delta),
        ...buildResearchFileDeltaRefs(
          normalizeResearchRefs(codexInput.expected_files),
          normalizeResearchRefs(codexInput.observed_files),
        ),
      ],
    ),
    review_cues: mergeResearchRefs(
      input.review_cues,
      normalizeResearchArrayInput(codexInput.boundary_notes),
    ),
    normalized_summary:
      sanitizeResearchSummary(input.normalized_summary).length > 0
        ? input.normalized_summary
        : codexInput.codex_claimed_summary,
  };
}

function buildDogfoodingResearchRecordReviewCuesV01(
  record: Omit<DogfoodingResearchRecord, "record_fingerprint">,
): DogfoodingResearchRecordReviewCue[] {
  const cueDrafts: Array<{
    cue_kind: DogfoodingResearchRecordReviewCueKind;
    public_safe_summary: string;
    source_refs: string[];
    reason_codes: DogfoodingResearchRecordReasonCode[];
  }> = [];
  appendResearchCue(cueDrafts, "inspect_pr_body", record.pr_refs, "pr_body_not_truth");
  appendResearchCue(
    cueDrafts,
    "inspect_changed_files",
    record.changed_file_refs,
    "changed_files_not_proof",
  );
  appendResearchCue(
    cueDrafts,
    "verify_validation_command",
    record.validation_refs,
    "validation_commands_diagnostic_only",
  );
  if (record.record_kind === "smoke_failure_report") {
    appendResearchCue(
      cueDrafts,
      "inspect_smoke_failure",
      record.validation_refs,
      "smoke_failure_not_rejection",
    );
  }
  appendResearchCue(
    cueDrafts,
    "inspect_skipped_check",
    record.skipped_check_refs,
    "skipped_checks_preserved",
  );
  appendResearchCue(
    cueDrafts,
    "review_known_warning",
    record.known_warning_refs,
    "known_warnings_preserved",
  );
  appendResearchCue(
    cueDrafts,
    "preserve_not_done_item",
    record.not_done_refs,
    "not_done_preserved",
  );
  appendResearchCue(
    cueDrafts,
    "resolve_expected_observed_delta",
    record.expected_observed_delta_refs,
    "expected_observed_delta_preserved",
  );
  if (record.record_kind === "operator_review_note") {
    appendResearchCue(
      cueDrafts,
      "review_operator_note",
      [record.normalized_summary],
      "candidate_only_review_material",
    );
  }
  if (record.record_kind === "merge_closeout_summary") {
    appendResearchCue(
      cueDrafts,
      "review_merge_closeout",
      [record.normalized_summary],
      "candidate_only_review_material",
    );
  }
  appendResearchCue(
    cueDrafts,
    "check_authority_boundary",
    record.source_refs,
    "candidate_only_review_material",
  );
  if (cueDrafts.length === 0) {
    cueDrafts.push({
      cue_kind: "no_action",
      public_safe_summary: "No immediate review cue beyond candidate-only preservation.",
      source_refs: [],
      reason_codes: ["candidate_only_review_material"],
    });
  }
  return cueDrafts.map((cue, index) => ({
    cue_id: `${record.record_id}:review-cue:${String(index + 1).padStart(3, "0")}`,
    cue_kind: cue.cue_kind,
    public_safe_summary: cue.public_safe_summary,
    source_refs: uniqueSortedResearch(cue.source_refs),
    reason_codes: uniqueSortedResearch(cue.reason_codes),
    candidate_only: true,
  }));
}

function appendResearchCue(
  cues: Array<{
    cue_kind: DogfoodingResearchRecordReviewCueKind;
    public_safe_summary: string;
    source_refs: string[];
    reason_codes: DogfoodingResearchRecordReasonCode[];
  }>,
  cueKind: DogfoodingResearchRecordReviewCueKind,
  sourceRefs: string[],
  reasonCode: DogfoodingResearchRecordReasonCode,
): void {
  if (sourceRefs.length === 0) return;
  cues.push({
    cue_kind: cueKind,
    public_safe_summary: summaryForResearchCue(cueKind),
    source_refs: sourceRefs,
    reason_codes: [reasonCode, "candidate_only_review_material"],
  });
}

function summaryForResearchCue(cueKind: DogfoodingResearchRecordReviewCueKind): string {
  const summaries: Record<DogfoodingResearchRecordReviewCueKind, string> = {
    inspect_pr_body: "PR refs are preserved as candidate-only review cues.",
    inspect_changed_files: "Changed file refs are preserved for later inspection.",
    verify_validation_command: "Validation command refs are diagnostic only.",
    inspect_smoke_failure: "Smoke failure refs are diagnostic only.",
    inspect_skipped_check: "Skipped checks require later operator review.",
    review_known_warning: "Known warnings are preserved as review cues.",
    preserve_not_done_item: "Not-done items remain candidate review material.",
    resolve_expected_observed_delta: "Expected/observed deltas require reconciliation.",
    review_operator_note: "Operator note is candidate-only review material.",
    review_merge_closeout: "Merge closeout summary is candidate-only review material.",
    check_authority_boundary: "Authority boundary notes remain candidate-only.",
    no_action: "No immediate review cue beyond candidate-only preservation.",
  };
  return summaries[cueKind];
}

function collectDogfoodingResearchRecordReasonCodesV01(
  record: Omit<DogfoodingResearchRecord, "record_fingerprint" | "reason_codes">,
  reviewCues: DogfoodingResearchRecordReviewCue[],
): DogfoodingResearchRecordReasonCode[] {
  const reasonCodes = new Set<DogfoodingResearchRecordReasonCode>([
    "dogfooding_research_record_runtime_present",
    "operator_supplied_payload_only",
    "same_origin_post_required",
    "caller_injected_local_db_only",
    "candidate_only_review_material",
    "public_safe_refs_only",
    "privacy_guard_applied",
    "pr_body_not_truth",
    "changed_files_not_proof",
    "validation_commands_diagnostic_only",
    "validation_pass_not_approval",
    "validation_failure_not_rejection",
    "smoke_pass_not_evidence",
    "smoke_failure_not_rejection",
    "ci_pass_not_authority",
    "ci_failure_diagnostic_only",
    "codex_result_not_execution_approval",
    "git_ref_reference_only",
    "github_pr_ref_reference_only",
    "product_write_denied",
    "promotion_not_executed",
    "proof_not_created",
    "evidence_not_created",
    "durable_state_not_applied",
    "formation_receipt_not_written",
    "review_memory_not_written",
    "provider_call_not_executed",
    "retrieval_not_executed",
    "source_fetch_not_executed",
    "git_github_not_executed",
    "release_not_executed",
  ]);
  if (record.skipped_check_refs.length > 0) reasonCodes.add("skipped_checks_preserved");
  if (record.known_warning_refs.length > 0) reasonCodes.add("known_warnings_preserved");
  if (record.not_done_refs.length > 0) reasonCodes.add("not_done_preserved");
  if (record.expected_observed_delta_refs.length > 0) {
    reasonCodes.add("expected_observed_delta_preserved");
  }
  for (const cue of reviewCues) {
    for (const reasonCode of cue.reason_codes) reasonCodes.add(reasonCode);
  }
  return Array.from(reasonCodes).sort();
}

function buildDogfoodingResearchRecordPrivacyReportV01(
  input: unknown,
): DogfoodingResearchRecordPrivacyReport {
  const researchFindings = detectResearchPrivacyFindings(input);
  const authorityFindings = detectResearchForbiddenAuthorityFindings(input);
  const findings = finalizeResearchFindings([
    ...researchFindings,
    ...authorityFindings,
  ]);
  if (authorityFindings.length > 0) {
    return baseDogfoodingResearchPrivacyReport("blocked_forbidden_authority", findings);
  }
  if (findings.length > 0) {
    return baseDogfoodingResearchPrivacyReport("blocked_private_or_raw_payload", findings);
  }
  return baseDogfoodingResearchPrivacyReport("passed", []);
}

function baseDogfoodingResearchPrivacyReport(
  status: DogfoodingResearchRecordPrivacyReport["status"],
  findings: ResearchFindingDraft[] | DogfoodingResearchRecordPrivacyFinding[] = [],
): DogfoodingResearchRecordPrivacyReport {
  const finalFindings = finalizeResearchFindings(findings);
  return {
    guard_ref: "privacy_redaction_runtime_guard_v0_1",
    status,
    findings: finalFindings,
    blocked_paths: uniqueSortedResearch(
      finalFindings
        .filter((finding) => finding.action === "blocked")
        .map((finding) => finding.path),
    ),
    redacted_paths: uniqueSortedResearch(
      finalFindings
        .filter(
          (finding) =>
            finding.action === "redacted" || finding.action === "reference_only",
        )
        .map((finding) => finding.path),
    ),
    reason_codes: uniqueSortedResearch([
      ...finalFindings.flatMap((finding) => finding.reason_codes),
      "public_safe_summary_only",
      "product_write_denied",
    ]),
    boundary_notes: [
      "Privacy Redaction Runtime Guard v0.1 conventions are applied without raw value echo.",
      "Dogfooding research records remain candidate-only review material.",
    ],
  };
}

function detectResearchPrivacyFindings(input: unknown): ResearchFindingDraft[] {
  const findings: ResearchFindingDraft[] = [];
  visitResearchValue(input, "input", (path, value) => {
    if (typeof value !== "string") return;
    const normalized = value.toLowerCase();
    const rules: Array<[RegExp | string, string, string]> = [
      [/https?:\/\//i, "private_or_live_url", "raw_private_payload_blocked"],
      [/(^|\s)\/(?:Users|home)\//i, "local_private_path", "raw_private_payload_blocked"],
      [/file:\/\//i, "local_private_path", "raw_private_payload_blocked"],
      [/\b(?:sk-|ghp_|token=|secret=|cookie=)[A-Za-z0-9_=-]{8,}\b/i, "secret_like_pattern", "raw_private_payload_blocked"],
      ["safe_marker_private_url", "private_url_marker", "raw_private_payload_blocked"],
      ["safe_marker_local_private_path", "local_private_path_marker", "raw_private_payload_blocked"],
      ["safe_marker_secret_token", "secret_marker", "raw_private_payload_blocked"],
      ["safe_marker_raw_terminal_log", "raw_terminal_log_marker", "raw_private_payload_blocked"],
      ["safe_marker_raw_github_payload", "raw_github_payload_marker", "raw_private_payload_blocked"],
      ["safe_marker_raw_provider_output", "raw_provider_output_marker", "raw_private_payload_blocked"],
      ["safe_marker_raw_retrieval_output", "raw_retrieval_output_marker", "raw_private_payload_blocked"],
      ["safe_marker_provider_thread_id", "provider_thread_marker", "raw_private_payload_blocked"],
      ["safe_marker_raw_conversation", "raw_conversation_marker", "raw_private_payload_blocked"],
      ["safe_marker_hidden_reasoning", "hidden_reasoning_marker", "raw_private_payload_blocked"],
      ["raw provider output", "raw_provider_output", "raw_private_payload_blocked"],
      ["raw retrieval output", "raw_retrieval_output", "raw_private_payload_blocked"],
      ["raw conversation", "raw_conversation", "raw_private_payload_blocked"],
      ["hidden reasoning", "hidden_reasoning", "raw_private_payload_blocked"],
      ["telemetry dump", "telemetry_dump", "raw_private_payload_blocked"],
      ["raw github payload", "raw_github_payload", "raw_private_payload_blocked"],
      ["raw terminal log", "raw_terminal_log", "raw_private_payload_blocked"],
      ["actual prompt:", "actual_prompt", "raw_private_payload_blocked"],
      ["provider response:", "provider_response", "raw_private_payload_blocked"],
    ];
    for (const [pattern, findingKind, reasonCode] of rules) {
      const matched =
        typeof pattern === "string"
          ? normalized.includes(pattern)
          : pattern.test(value);
      if (!matched) continue;
      findings.push({
        path,
        finding_kind: findingKind,
        action: "blocked",
        reason_codes: [reasonCode, "public_safe_summary_only"],
        public_safe_summary: `${findingKind} blocked; original value omitted.`,
        original_value_included: false,
      });
    }
  });
  return findings;
}

function detectResearchForbiddenAuthorityFindings(input: unknown): ResearchFindingDraft[] {
  const findings: ResearchFindingDraft[] = [];
  visitResearchValue(input, "input", (path, value, key) => {
    if (key && isResearchForbiddenAuthorityField(key, value)) {
      findings.push({
        path,
        finding_kind: "forbidden_authority_claim",
        action: "blocked",
        reason_codes: [
          "forbidden_authority_blocked",
          reasonCodeForResearchAuthorityField(key),
        ],
        public_safe_summary:
          "Forbidden authority claim was blocked; original value omitted.",
        original_value_included: false,
      });
    }
    if (typeof value !== "string") return;
    const normalized = value.toLowerCase().replace(/\s+/g, " ").trim();
    for (const [subject, object] of researchBlockedAuthorityPhraseParts) {
      const variants = [
        `${subject} is ${object}`,
        `${subject} = ${object}`,
        `${subject} as ${object}`,
      ];
      if (!variants.some((variant) => normalized.includes(variant))) continue;
      findings.push({
        path,
        finding_kind: "forbidden_authority_phrase",
        action: "blocked",
        reason_codes: ["forbidden_authority_blocked"],
        public_safe_summary:
          "Forbidden authority phrase was blocked; original value omitted.",
        original_value_included: false,
      });
    }
  });
  return findings;
}

function isResearchForbiddenAuthorityField(key: string, value: unknown): boolean {
  if (
    researchAllowedTrueAuthorityFields.includes(
      key as (typeof researchAllowedTrueAuthorityFields)[number],
    )
  ) {
    return false;
  }
  const isKnownForbidden = researchForbiddenAuthorityFields.includes(
    key as (typeof researchForbiddenAuthorityFields)[number],
  );
  const looksForbidden =
    /(?:_now|_authority|_is_truth|_is_proof|_is_evidence|_is_approval|_is_rejection)$/.test(
      key,
    ) && key !== "same_origin_route_now" && key !== "local_test_db_query_or_write_now";
  return (isKnownForbidden || looksForbidden) && value !== false && value !== null && value !== undefined;
}

function reasonCodeForResearchAuthorityField(
  key: string,
): DogfoodingResearchRecordReasonCode {
  if (key.includes("product")) return "product_write_denied";
  if (key.includes("promotion")) return "promotion_not_executed";
  if (key.includes("proof")) return "proof_not_created";
  if (key.includes("evidence")) return "evidence_not_created";
  if (key.includes("durable")) return "durable_state_not_applied";
  if (key.includes("formation")) return "formation_receipt_not_written";
  if (key.includes("review_memory")) return "review_memory_not_written";
  if (key.includes("provider") || key.includes("prompt")) return "provider_call_not_executed";
  if (key.includes("retrieval")) return "retrieval_not_executed";
  if (key.includes("source_fetch")) return "source_fetch_not_executed";
  if (key.includes("github") || key.includes("git_")) return "git_github_not_executed";
  if (key.includes("release") || key.includes("deploy") || key.includes("publish")) {
    return "release_not_executed";
  }
  return "forbidden_authority_blocked";
}

function researchStoreResult(
  status: DogfoodingResearchRecordStoreStatus,
  record: DogfoodingResearchRecord | null = null,
  records: DogfoodingResearchRecord[] = [],
  privacyReport: DogfoodingResearchRecordPrivacyReport | null = null,
  idempotentReplay = false,
): DogfoodingResearchRecordStoreResult {
  const ok = ["created", "read", "listed", "duplicate_record"].includes(status);
  return {
    ok,
    status,
    record,
    records,
    error_code: ok ? null : status,
    idempotent_replay: idempotentReplay,
    privacy_report: privacyReport,
    durable_state_mutated: false,
    review_memory_written: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    promotion_executed: false,
    formation_receipt_written: false,
    product_write_executed: false,
    github_git_actuated: false,
    provider_called: false,
    retrieval_executed: false,
    source_fetched: false,
    release_deploy_publish_executed: false,
    authority_boundary: createDogfoodingResearchRecordAuthorityBoundaryV01(),
  };
}

function normalizeResearchRefs(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return uniqueSortedResearch(
    value.map((item) => sanitizeResearchSummary(item)).filter((item) => item.length > 0),
  );
}

function normalizeResearchArrayInput(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null) return [];
  return [value];
}

function buildResearchFileDeltaRefs(expectedFiles: string[], observedFiles: string[]): string[] {
  const expectedSet = new Set(expectedFiles);
  const observedSet = new Set(observedFiles);
  return [
    ...expectedFiles
      .filter((fileRef) => !observedSet.has(fileRef))
      .map((fileRef) => `missing-observed-file:${fileRef}`),
    ...observedFiles
      .filter((fileRef) => !expectedSet.has(fileRef))
      .map((fileRef) => `unexpected-observed-file:${fileRef}`),
  ];
}

function mergeResearchRefs(left: unknown[] | undefined, right: unknown[]): unknown[] {
  return [...(Array.isArray(left) ? left : []), ...right];
}

function sanitizeResearchSummary(value: unknown): string {
  if (typeof value === "string") return clampResearchText(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) {
    return clampResearchText(value.map(sanitizeResearchSummary).filter(Boolean).join(" | "));
  }
  if (isResearchRecord(value)) {
    return clampResearchText(
      Object.keys(value)
        .sort()
        .map((key) => `${key}:${sanitizeResearchSummary(value[key])}`)
        .filter((entry) => !entry.endsWith(":"))
        .join("; "),
    );
  }
  return "[unsupported-public-safe-value]";
}

function clampResearchText(value: string): string {
  const collapsed = value.replace(/\s+/g, " ").trim();
  return collapsed.length > 320 ? `${collapsed.slice(0, 317)}...` : collapsed;
}

function hasResearchSummary(value: unknown): boolean {
  return sanitizeResearchSummary(value).length > 0;
}

function isSafeResearchString(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    detectResearchPrivacyFindings(value).length === 0
  );
}

function finalizeResearchFindings(
  findings: ResearchFindingDraft[] | DogfoodingResearchRecordPrivacyFinding[],
): DogfoodingResearchRecordPrivacyFinding[] {
  const merged = new Map<string, ResearchFindingDraft>();
  for (const finding of findings) {
    const key = `${finding.path}:${finding.finding_kind}`;
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, finding);
      continue;
    }
    merged.set(key, {
      path: finding.path,
      finding_kind: finding.finding_kind,
      action: existing.action === "blocked" || finding.action === "blocked" ? "blocked" : finding.action,
      reason_codes: uniqueSortedResearch([
        ...existing.reason_codes,
        ...finding.reason_codes,
      ]),
      public_safe_summary: finding.public_safe_summary,
      original_value_included: false,
    });
  }
  return Array.from(merged.values())
    .sort((left, right) => `${left.path}:${left.finding_kind}`.localeCompare(`${right.path}:${right.finding_kind}`))
    .map((finding, index) => ({
      finding_id: `dogfooding-research-record:finding:${String(index + 1).padStart(3, "0")}`,
      ...finding,
    }));
}

function visitResearchValue(
  value: unknown,
  path: string,
  visitor: (path: string, value: unknown, key?: string) => void,
  key?: string,
): void {
  visitor(path, value, key);
  if (Array.isArray(value)) {
    value.forEach((item, index) => visitResearchValue(item, `${path}[${index}]`, visitor));
    return;
  }
  if (!isResearchRecord(value)) return;
  for (const objectKey of Object.keys(value).sort()) {
    visitResearchValue(value[objectKey], `${path}.${objectKey}`, visitor, objectKey);
  }
}

function parseResearchStringArray(value: string): string[] {
  const parsed = parseJson(value);
  return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
}

function parseResearchReviewCues(value: string): DogfoodingResearchRecordReviewCue[] {
  const parsed = parseJson(value);
  return Array.isArray(parsed) ? (parsed as DogfoodingResearchRecordReviewCue[]) : [];
}

function parseResearchPrivacyReport(value: string): DogfoodingResearchRecordPrivacyReport {
  const parsed = parseJson(value);
  return isResearchRecord(parsed)
    ? (parsed as unknown as DogfoodingResearchRecordPrivacyReport)
    : baseDogfoodingResearchPrivacyReport("rejected");
}

function parseResearchAuthorityBoundary(value: string): DogfoodingResearchRecordAuthorityBoundary {
  const parsed = parseJson(value);
  return isResearchRecord(parsed)
    ? (parsed as unknown as DogfoodingResearchRecordAuthorityBoundary)
    : createDogfoodingResearchRecordAuthorityBoundaryV01();
}

function parseResearchReasonCodes(value: string): DogfoodingResearchRecordReasonCode[] {
  return parseResearchStringArray(value) as DogfoodingResearchRecordReasonCode[];
}

function isResearchRecord(value: unknown): value is ResearchJsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function uniqueSortedResearch<T extends string>(values: Iterable<T>): T[] {
  return Array.from(new Set(values)).sort();
}

function canonicalResearchJson(value: unknown): string {
  return JSON.stringify(sortResearchValue(value));
}

function sortResearchValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortResearchValue);
  if (isResearchRecord(value)) {
    const sorted: ResearchJsonRecord = {};
    for (const key of Object.keys(value).sort()) {
      sorted[key] = sortResearchValue(value[key]);
    }
    return sorted;
  }
  return value;
}

function omitResearchFingerprint(value: unknown): unknown {
  if (!isResearchRecord(value)) return value;
  const clone: ResearchJsonRecord = {};
  for (const key of Object.keys(value)) {
    if (key !== "record_fingerprint") clone[key] = value[key];
  }
  return clone;
}
