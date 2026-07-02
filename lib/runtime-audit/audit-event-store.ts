import { createHash } from "node:crypto";

import {
  PRIVACY_REDACTION_RUNTIME_GUARD_VERSION,
  buildPrivacyRedactionRuntimeGuardReportV01,
  createPrivacyRedactionRuntimeGuardAuthorityBoundaryV01,
  createPrivacyRedactionRuntimeGuardFingerprintV01,
  type PrivacyRedactionRuntimeGuardFinding,
  type PrivacyRedactionRuntimeGuardReport,
} from "../privacy/redaction-guard";
import {
  SelectedRuntimeAuditEventKindsV01,
  SelectedRuntimeAuditEventNextSliceV01,
  SelectedRuntimeAuditEventScopeV01,
  SelectedRuntimeAuditEventSliceV01,
  SelectedRuntimeAuditEventStoreVersionV01,
  SelectedRuntimeAuditEventVersionV01,
  type SelectedRuntimeAuditEventAuthorityBoundaryV01,
  type SelectedRuntimeAuditEventInputV01,
  type SelectedRuntimeAuditEventKindV01,
  type SelectedRuntimeAuditEventListFiltersV01,
  type SelectedRuntimeAuditEventPrivacyReportV01,
  type SelectedRuntimeAuditEventStatusV01,
  type SelectedRuntimeAuditEventStoreResultV01,
  type SelectedRuntimeAuditEventV01,
} from "../../types/runtime-audit-event";

const scope = "project:augnes" as const;
const tableName = "runtime_audit_events";

export const RUNTIME_AUDIT_EVENT_STORE_VERSION =
  "runtime_audit_event_store.v0.1" as const;
export const RUNTIME_AUDIT_EVENT_ROUTE_VERSION =
  "runtime_audit_event_route.v0.1" as const;
export const RUNTIME_AUDIT_EVENT_REQUEST_VERSION =
  "runtime_audit_event_request.v0.1" as const;
export const RUNTIME_AUDIT_EVENT_VERSION = "runtime_audit_event.v0.1" as const;

export type RuntimeAuditEventKindV01 =
  | "route_request"
  | "route_response"
  | "runtime_helper_result"
  | "store_write"
  | "store_read"
  | "validation_block"
  | "same_origin_rejection"
  | "private_raw_block"
  | "forbidden_authority_block"
  | "db_missing"
  | "schema_missing"
  | "smoke_validation"
  | "operator_action"
  | "unknown";

export type RuntimeAuditEventSurfaceV01 =
  | "review_memory_db_store"
  | "review_memory_db_routes"
  | "review_memory_db_ui"
  | "source_intake_runtime"
  | "provider_extraction_runtime"
  | "retrieval_index_runtime"
  | "rag_context_preview_runtime"
  | "final_rag_answer_candidate_review_runtime"
  | "final_rag_answer_review_memory_binding_runtime"
  | "promotion_readiness_packet_from_review_memory_runtime"
  | "constellation_runtime_ui"
  | "manual_anchors_runtime"
  | "feedback_event_write_runtime"
  | "feedback_aggregation_runtime"
  | "feedback_surfacing_preview_runtime"
  | "runtime_audit_panel"
  | "dogfooding_ingestion_runtime"
  | "promotion_decision_store"
  | "formation_receipt_runtime"
  | "durable_perspective_state_runtime"
  | "perspective_trajectory_runtime"
  | "product_write_gate"
  | "unknown";

export type RuntimeAuditEventWriteStatusV01 =
  | "audit_event_created"
  | "idempotent_existing"
  | "conflict_existing_audit_event"
  | "blocked_private_or_raw_payload"
  | "blocked_forbidden_authority"
  | "blocked_invalid_input"
  | "invalid_db_path"
  | "rejected";

export interface RuntimeAuditSqliteLikeV01 {
  exec?: (sql: string) => unknown;
  prepare(sql: string): {
    get?: (...values: unknown[]) => unknown;
    all?: (...values: unknown[]) => unknown[];
    run?: (...values: unknown[]) => { changes?: number };
  };
}

export interface RuntimeAuditEventInputV01 {
  request_version: typeof RUNTIME_AUDIT_EVENT_REQUEST_VERSION;
  event_version: typeof RUNTIME_AUDIT_EVENT_VERSION;
  scope: typeof scope;
  audit_event_id: string;
  event_kind: RuntimeAuditEventKindV01;
  event_surface: RuntimeAuditEventSurfaceV01;
  event_action: string;
  event_status: string;
  subject_ref: string;
  related_refs: string[];
  route_ref?: string;
  runtime_slice_ref: string;
  created_by: string;
  created_at: string;
  bounded_summary: string;
  bounded_error_code?: string;
  authority_boundary?: RuntimeAuditEventAuthorityBoundaryV01 | Record<string, unknown>;
  privacy_report?: Record<string, unknown>;
  reason_codes: string[];
}

export interface RuntimeAuditEventRecordV01 extends RuntimeAuditEventInputV01 {
  event_fingerprint: string;
}

export interface RuntimeAuditEventWriteResultV01 {
  store_version: typeof RUNTIME_AUDIT_EVENT_STORE_VERSION;
  event_version: typeof RUNTIME_AUDIT_EVENT_VERSION;
  scope: typeof scope;
  status: RuntimeAuditEventWriteStatusV01;
  audit_event_id: string | null;
  audit_event_ref: string | null;
  event_fingerprint: string | null;
  audit_event_persisted: boolean;
  authority_boundary: RuntimeAuditEventAuthorityBoundaryV01;
  reason_codes: string[];
}

export interface RuntimeAuditEventAuthorityBoundaryV01 {
  runtime_audit_panel_runtime_completion_now: true;
  runtime_audit_event_persistence_now: boolean;
  runtime_audit_event_read_now: boolean;
  caller_injected_db_only: true;
  same_origin_audit_route_now: true;
  audit_model_readonly_now: true;
  bounded_summary_only: true;
  raw_request_body_stored_now: false;
  raw_response_body_stored_now: false;
  raw_terminal_log_stored_now: false;
  browser_dump_ingested_now: false;
  hidden_reasoning_stored_now: false;
  raw_provider_output_stored_now: false;
  raw_retrieval_output_stored_now: false;
  provider_openai_call_now: false;
  prompt_sent_now: false;
  source_fetch_now: false;
  retrieval_execution_now: false;
  retrieval_index_write_now: false;
  rag_answer_generation_now: false;
  proof_or_evidence_record_now: false;
  claim_or_evidence_write_now: false;
  work_item_write_now: false;
  promotion_execution_now: false;
  durable_state_write_now: false;
  durable_state_apply_now: false;
  formation_receipt_write_now: false;
  product_write_now: false;
  product_write_runtime_now: false;
  product_write_adapter_enabled_now: false;
  product_id_allocation_now: false;
  product_persistence_now: false;
  git_ledger_export_runtime_now: false;
  git_write_now: false;
  github_api_call_now: false;
  repository_file_write_now: false;
  local_file_export_now: false;
  local_file_import_now: false;
  codex_execution_now: false;
  codex_execution_authority: false;
  github_automation_authority: false;
  product_write_authority: false;
  audit_event_is_truth: false;
  audit_event_is_proof: false;
  audit_event_is_approval: false;
  audit_event_is_durable_state: false;
  audit_event_is_product_write_authority: false;
  smoke_pass_is_truth: false;
  ci_pass_is_truth: false;
}

export interface RuntimeAuditEventListFiltersV01 {
  event_surface?: RuntimeAuditEventSurfaceV01;
  event_kind?: RuntimeAuditEventKindV01;
  event_status?: string;
  subject_ref?: string;
  limit?: number;
}

const eventKinds: RuntimeAuditEventKindV01[] = [
  "route_request",
  "route_response",
  "runtime_helper_result",
  "store_write",
  "store_read",
  "validation_block",
  "same_origin_rejection",
  "private_raw_block",
  "forbidden_authority_block",
  "db_missing",
  "schema_missing",
  "smoke_validation",
  "operator_action",
  "unknown",
];

const eventSurfaces: RuntimeAuditEventSurfaceV01[] = [
  "review_memory_db_store",
  "review_memory_db_routes",
  "review_memory_db_ui",
  "source_intake_runtime",
  "provider_extraction_runtime",
  "retrieval_index_runtime",
  "rag_context_preview_runtime",
  "final_rag_answer_candidate_review_runtime",
  "final_rag_answer_review_memory_binding_runtime",
  "promotion_readiness_packet_from_review_memory_runtime",
  "constellation_runtime_ui",
  "manual_anchors_runtime",
  "feedback_event_write_runtime",
  "feedback_aggregation_runtime",
  "feedback_surfacing_preview_runtime",
  "runtime_audit_panel",
  "dogfooding_ingestion_runtime",
  "promotion_decision_store",
  "formation_receipt_runtime",
  "durable_perspective_state_runtime",
  "perspective_trajectory_runtime",
  "product_write_gate",
  "unknown",
];

const allowedTrueAuthorityFields = new Set([
  "runtime_audit_panel_runtime_completion_now",
  "runtime_audit_event_persistence_now",
  "runtime_audit_event_read_now",
  "caller_injected_db_only",
  "same_origin_audit_route_now",
  "audit_model_readonly_now",
  "bounded_summary_only",
]);

const forbiddenAuthorityFields = new Set([
  "raw_request_body_stored_now",
  "raw_response_body_stored_now",
  "raw_terminal_log_stored_now",
  "browser_dump_ingested_now",
  "hidden_reasoning_stored_now",
  "raw_provider_output_stored_now",
  "raw_retrieval_output_stored_now",
  "provider_openai_call_now",
  "prompt_sent_now",
  "source_fetch_now",
  "retrieval_execution_now",
  "retrieval_index_write_now",
  "rag_answer_generation_now",
  "proof_or_evidence_record_now",
  "claim_or_evidence_write_now",
  "work_item_write_now",
  "promotion_execution_now",
  "durable_state_write_now",
  "durable_state_apply_now",
  "formation_receipt_write_now",
  "product_write_now",
  "product_write_runtime_now",
  "product_write_adapter_enabled_now",
  "product_id_allocation_now",
  "product_persistence_now",
  "git_ledger_export_runtime_now",
  "git_write_now",
  "github_api_call_now",
  "repository_file_write_now",
  "local_file_export_now",
  "local_file_import_now",
  "codex_execution_now",
  "codex_execution_authority",
  "github_automation_authority",
  "product_write_authority",
  "audit_event_is_truth",
  "audit_event_is_proof",
  "audit_event_is_approval",
  "audit_event_is_durable_state",
  "audit_event_is_product_write_authority",
  "smoke_pass_is_truth",
  "ci_pass_is_truth",
]);

const rawForbiddenKeys = new Set([
  "raw_request_body",
  "raw_response_body",
  "raw_terminal_log",
  "raw_provider_output",
  "raw_retrieval_output",
  "hidden_reasoning",
  "browser_dump",
]);

const unsafePattern =
  /(SAFE_MARKER_|\/Users\/|\/home\/|file:\/\/|https:\/\/localhost|http:\/\/localhost|sk-|ghp_|OPENAI_API_KEY|GITHUB_TOKEN|password:|secret:|secret[-_]?token|token[-_]?secret|api[-_]?key|private key|raw request body|raw response body|raw terminal log|browser dump|raw browser dump|raw provider output|raw retrieval output|raw source body|raw conversation|hidden reasoning|telemetry dump|raw DB row|raw_db_row|actual prompt:|provider response:|actual query:|embedding vector:|vector index dump|raw diff)/i;

export const runtimeAuditEventSchemaSqlV01 = `
CREATE TABLE IF NOT EXISTS runtime_audit_events (
  audit_event_id TEXT PRIMARY KEY,
  scope TEXT NOT NULL,
  event_kind TEXT NOT NULL,
  event_surface TEXT NOT NULL,
  event_action TEXT NOT NULL,
  event_status TEXT NOT NULL,
  subject_ref TEXT NOT NULL,
  related_refs_json TEXT NOT NULL,
  route_ref TEXT,
  runtime_slice_ref TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  bounded_summary TEXT NOT NULL,
  bounded_error_code TEXT,
  authority_boundary_json TEXT NOT NULL,
  privacy_report_json TEXT NOT NULL,
  reason_codes_json TEXT NOT NULL,
  event_fingerprint TEXT NOT NULL,
  event_json TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_runtime_audit_events_surface
  ON runtime_audit_events(event_surface);

CREATE INDEX IF NOT EXISTS idx_runtime_audit_events_kind
  ON runtime_audit_events(event_kind);

CREATE INDEX IF NOT EXISTS idx_runtime_audit_events_status
  ON runtime_audit_events(event_status);

CREATE INDEX IF NOT EXISTS idx_runtime_audit_events_subject
  ON runtime_audit_events(subject_ref);

CREATE INDEX IF NOT EXISTS idx_runtime_audit_events_created_at
  ON runtime_audit_events(created_at);
`.trim();

export function ensureRuntimeAuditEventSchemaV01(db: RuntimeAuditSqliteLikeV01): void {
  db.exec?.(runtimeAuditEventSchemaSqlV01);
}

export function runtimeAuditEventSchemaExistsV01(db: RuntimeAuditSqliteLikeV01): boolean {
  const row = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1")
    .get?.(tableName);
  return Boolean(row);
}

export function isSafeRuntimeAuditDbPathV01(value: unknown): boolean {
  if (typeof value !== "string") return false;
  if (value.length === 0 || value.length > 220) return false;
  if (!value.endsWith(".sqlite") && !value.endsWith(".db")) return false;
  if (!/^(tmp|\.tmp)\/runtime-audit\/[A-Za-z0-9._/-]+$/.test(value)) return false;
  if (
    value.startsWith("/") ||
    value.includes("..") ||
    value.includes("\\") ||
    value.includes("\0") ||
    /^[a-z][a-z0-9+.-]*:/i.test(value) ||
    unsafePattern.test(value)
  ) {
    return false;
  }
  return true;
}

export function createRuntimeAuditEventAuthorityBoundaryV01(
  options: { persistenceNow?: boolean; readNow?: boolean } = {},
): RuntimeAuditEventAuthorityBoundaryV01 {
  return {
    runtime_audit_panel_runtime_completion_now: true,
    runtime_audit_event_persistence_now: options.persistenceNow === true,
    runtime_audit_event_read_now: options.readNow === true,
    caller_injected_db_only: true,
    same_origin_audit_route_now: true,
    audit_model_readonly_now: true,
    bounded_summary_only: true,
    raw_request_body_stored_now: false,
    raw_response_body_stored_now: false,
    raw_terminal_log_stored_now: false,
    browser_dump_ingested_now: false,
    hidden_reasoning_stored_now: false,
    raw_provider_output_stored_now: false,
    raw_retrieval_output_stored_now: false,
    provider_openai_call_now: false,
    prompt_sent_now: false,
    source_fetch_now: false,
    retrieval_execution_now: false,
    retrieval_index_write_now: false,
    rag_answer_generation_now: false,
    proof_or_evidence_record_now: false,
    claim_or_evidence_write_now: false,
    work_item_write_now: false,
    promotion_execution_now: false,
    durable_state_write_now: false,
    durable_state_apply_now: false,
    formation_receipt_write_now: false,
    product_write_now: false,
    product_write_runtime_now: false,
    product_write_adapter_enabled_now: false,
    product_id_allocation_now: false,
    product_persistence_now: false,
    git_ledger_export_runtime_now: false,
    git_write_now: false,
    github_api_call_now: false,
    repository_file_write_now: false,
    local_file_export_now: false,
    local_file_import_now: false,
    codex_execution_now: false,
    codex_execution_authority: false,
    github_automation_authority: false,
    product_write_authority: false,
    audit_event_is_truth: false,
    audit_event_is_proof: false,
    audit_event_is_approval: false,
    audit_event_is_durable_state: false,
    audit_event_is_product_write_authority: false,
    smoke_pass_is_truth: false,
    ci_pass_is_truth: false,
  };
}

export function createRuntimeAuditEventFingerprintV01(input: RuntimeAuditEventInputV01): string {
  return hashStable(normalizeRuntimeAuditEventInputV01(input));
}

export function createRuntimeAuditEventV01(
  input: RuntimeAuditEventInputV01,
  db: RuntimeAuditSqliteLikeV01,
): RuntimeAuditEventWriteResultV01 {
  const validation = validateRuntimeAuditEventInputV01(input);
  if (!validation.passed) return blockedResult(statusForFailures(validation.failure_codes), input, validation.failure_codes);

  ensureRuntimeAuditEventSchemaV01(db);
  const normalized = normalizeRuntimeAuditEventInputV01(input);
  const eventFingerprint = createRuntimeAuditEventFingerprintV01(normalized);
  const existing = readRuntimeAuditEventV01(normalized.audit_event_id, db);
  if (existing) {
    if (existing.event_fingerprint === eventFingerprint) {
      return writeResult("idempotent_existing", normalized.audit_event_id, eventFingerprint, false, [
        "idempotent_existing",
        "audit_event_not_duplicated",
      ]);
    }
    return writeResult("conflict_existing_audit_event", normalized.audit_event_id, eventFingerprint, false, [
      "audit_event_id_conflict",
      "no_partial_write",
    ]);
  }

  db
    .prepare(
      `INSERT INTO ${tableName} (
        audit_event_id,
        scope,
        event_kind,
        event_surface,
        event_action,
        event_status,
        subject_ref,
        related_refs_json,
        route_ref,
        runtime_slice_ref,
        created_by,
        created_at,
        bounded_summary,
        bounded_error_code,
        authority_boundary_json,
        privacy_report_json,
        reason_codes_json,
        event_fingerprint,
        event_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run?.(
      normalized.audit_event_id,
      normalized.scope,
      normalized.event_kind,
      normalized.event_surface,
      normalized.event_action,
      normalized.event_status,
      normalized.subject_ref,
      JSON.stringify(normalized.related_refs),
      normalized.route_ref ?? null,
      normalized.runtime_slice_ref,
      normalized.created_by,
      normalized.created_at,
      normalized.bounded_summary,
      normalized.bounded_error_code ?? null,
      JSON.stringify(createRuntimeAuditEventAuthorityBoundaryV01({ persistenceNow: true })),
      JSON.stringify(normalized.privacy_report ?? {}),
      JSON.stringify(normalized.reason_codes),
      eventFingerprint,
      stableStringify(normalized),
    );

  return writeResult("audit_event_created", normalized.audit_event_id, eventFingerprint, true, [
    "audit_event_created",
    "bounded_summary_only",
  ]);
}

export function readRuntimeAuditEventV01(
  auditEventId: string,
  db: RuntimeAuditSqliteLikeV01,
): RuntimeAuditEventRecordV01 | null {
  const row = db
    .prepare(`SELECT event_json, event_fingerprint FROM ${tableName} WHERE audit_event_id = ? LIMIT 1`)
    .get?.(auditEventId);
  return runtimeAuditEventFromRow(row);
}

export function listRuntimeAuditEventsV01(
  filters: RuntimeAuditEventListFiltersV01,
  db: RuntimeAuditSqliteLikeV01,
): RuntimeAuditEventRecordV01[] {
  const validationFailures = validateRuntimeAuditFiltersV01(filters);
  if (validationFailures.length > 0) return [];
  const clauses: string[] = [];
  const values: unknown[] = [];
  if (filters.event_surface) {
    clauses.push("event_surface = ?");
    values.push(filters.event_surface);
  }
  if (filters.event_kind) {
    clauses.push("event_kind = ?");
    values.push(filters.event_kind);
  }
  if (filters.event_status) {
    clauses.push("event_status = ?");
    values.push(filters.event_status);
  }
  if (filters.subject_ref) {
    clauses.push("subject_ref = ?");
    values.push(filters.subject_ref);
  }
  const limit = clampLimit(filters.limit);
  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows =
    db
      .prepare(
        `SELECT event_json, event_fingerprint FROM ${tableName}
         ${where}
         ORDER BY created_at DESC, audit_event_id ASC
         LIMIT ?`,
      )
      .all?.(...values, limit) ?? [];
  return rows
    .map((row) => runtimeAuditEventFromRow(row))
    .filter((event): event is RuntimeAuditEventRecordV01 => Boolean(event));
}

export function validateRuntimeAuditEventInputV01(
  input: unknown,
): { passed: boolean; failure_codes: string[] } {
  const failures: string[] = [];
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { passed: false, failure_codes: ["input_not_object"] };
  }
  const value = input as Partial<RuntimeAuditEventInputV01>;
  if (value.request_version !== RUNTIME_AUDIT_EVENT_REQUEST_VERSION) failures.push("request_version_invalid");
  if (value.event_version !== RUNTIME_AUDIT_EVENT_VERSION) failures.push("event_version_invalid");
  if (value.scope !== scope) failures.push("scope_invalid");
  validatePublicString(value.audit_event_id, "audit_event_id", failures);
  if (!eventKinds.includes(value.event_kind as RuntimeAuditEventKindV01)) failures.push("event_kind_invalid");
  if (!eventSurfaces.includes(value.event_surface as RuntimeAuditEventSurfaceV01)) failures.push("event_surface_invalid");
  validatePublicString(value.event_action, "event_action", failures);
  validatePublicString(value.event_status, "event_status", failures);
  validatePublicString(value.subject_ref, "subject_ref", failures);
  validatePublicStringArray(value.related_refs, "related_refs", failures);
  if (value.route_ref !== undefined) validatePublicString(value.route_ref, "route_ref", failures);
  validatePublicString(value.runtime_slice_ref, "runtime_slice_ref", failures);
  validatePublicString(value.created_by, "created_by", failures);
  validatePublicString(value.created_at, "created_at", failures);
  validateBoundedSummary(value.bounded_summary, "bounded_summary", failures);
  if (value.bounded_error_code !== undefined) {
    validatePublicString(value.bounded_error_code, "bounded_error_code", failures);
  }
  validateReasonCodes(value.reason_codes, "reason_codes", failures);
  collectUnsafeFailures(value, "input", failures);
  collectForbiddenAuthorityFailures(value, "input", failures);
  return { passed: failures.length === 0, failure_codes: uniqueSorted(failures) };
}

export function validateRuntimeAuditFiltersV01(filters: unknown): string[] {
  const failures: string[] = [];
  if (!filters || typeof filters !== "object" || Array.isArray(filters)) return failures;
  const value = filters as RuntimeAuditEventListFiltersV01;
  if (value.event_surface !== undefined && !eventSurfaces.includes(value.event_surface)) {
    failures.push("event_surface_invalid");
  }
  if (value.event_kind !== undefined && !eventKinds.includes(value.event_kind)) {
    failures.push("event_kind_invalid");
  }
  if (value.event_status !== undefined) validatePublicString(value.event_status, "event_status", failures);
  if (value.subject_ref !== undefined) validatePublicString(value.subject_ref, "subject_ref", failures);
  if (value.limit !== undefined && (!Number.isInteger(value.limit) || value.limit < 1 || value.limit > 200)) {
    failures.push("limit_invalid");
  }
  collectUnsafeFailures(value, "filters", failures);
  collectForbiddenAuthorityFailures(value, "filters", failures);
  return uniqueSorted(failures);
}

function runtimeAuditEventFromRow(row: unknown): RuntimeAuditEventRecordV01 | null {
  if (!row || typeof row !== "object") return null;
  const record = row as Record<string, unknown>;
  if (typeof record.event_json !== "string" || typeof record.event_fingerprint !== "string") {
    return null;
  }
  try {
    const parsed = JSON.parse(record.event_json);
    const validation = validateRuntimeAuditEventInputV01(parsed);
    if (!validation.passed) return null;
    return {
      ...normalizeRuntimeAuditEventInputV01(parsed as RuntimeAuditEventInputV01),
      event_fingerprint: record.event_fingerprint,
    };
  } catch {
    return null;
  }
}

function normalizeRuntimeAuditEventInputV01(
  input: RuntimeAuditEventInputV01,
): RuntimeAuditEventInputV01 {
  return {
    request_version: RUNTIME_AUDIT_EVENT_REQUEST_VERSION,
    event_version: RUNTIME_AUDIT_EVENT_VERSION,
    scope,
    audit_event_id: input.audit_event_id.trim(),
    event_kind: input.event_kind,
    event_surface: input.event_surface,
    event_action: input.event_action.trim(),
    event_status: input.event_status.trim(),
    subject_ref: input.subject_ref.trim(),
    related_refs: uniqueSorted(input.related_refs.map((ref) => ref.trim())),
    route_ref: input.route_ref?.trim(),
    runtime_slice_ref: input.runtime_slice_ref.trim(),
    created_by: input.created_by.trim(),
    created_at: input.created_at.trim(),
    bounded_summary: input.bounded_summary.trim(),
    bounded_error_code: input.bounded_error_code?.trim(),
    authority_boundary: createRuntimeAuditEventAuthorityBoundaryV01({ persistenceNow: true }),
    privacy_report: input.privacy_report ?? { bounded_summary_only: true },
    reason_codes: uniqueSorted([
      ...input.reason_codes.map((code) => code.trim()),
      "runtime_audit_event_persisted",
      "bounded_summary_only",
      "audit_event_is_not_truth",
      "product_write_denied",
    ]),
  };
}

function validatePublicString(value: unknown, label: string, failures: string[]): void {
  if (typeof value !== "string") {
    failures.push(`${label}_not_string`);
    return;
  }
  if (value.trim().length === 0 || value.length > 240) {
    failures.push(`${label}_invalid`);
    return;
  }
  if (unsafePattern.test(value)) failures.push(`${label}_private_or_raw_payload`);
}

function validateBoundedSummary(value: unknown, label: string, failures: string[]): void {
  if (typeof value !== "string") {
    failures.push(`${label}_not_string`);
    return;
  }
  if (value.trim().length === 0 || value.length > 800) failures.push(`${label}_invalid`);
  if (unsafePattern.test(value)) failures.push(`${label}_private_or_raw_payload`);
}

function validatePublicStringArray(value: unknown, label: string, failures: string[]): void {
  if (!Array.isArray(value)) {
    failures.push(`${label}_not_array`);
    return;
  }
  value.forEach((item, index) => validatePublicString(item, `${label}.${index}`, failures));
}

function validateReasonCodes(value: unknown, label: string, failures: string[]): void {
  if (!Array.isArray(value)) {
    failures.push(`${label}_not_array`);
    return;
  }
  value.forEach((item, index) => validatePublicString(item, `${label}.${index}`, failures));
}

function collectUnsafeFailures(
  value: unknown,
  label: string,
  failures: string[],
  seen = new WeakSet<object>(),
): void {
  if (!value || typeof value !== "object") return;
  if (seen.has(value)) return;
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectUnsafeFailures(item, `${label}.${index}`, failures, seen));
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (rawForbiddenKeys.has(key)) failures.push(`${label}.${key}_raw_payload_field_blocked`);
    if (typeof child === "string") {
      if (/\/Users\/|\/home\//.test(child)) failures.push(`${label}.${key}_local_path_blocked`);
      if (/file:\/\//i.test(child)) failures.push(`${label}.${key}_private_url_blocked`);
      if (/sk-|ghp_|OPENAI_API_KEY|GITHUB_TOKEN|password:|secret:|secret[-_]?token|token[-_]?secret|api[-_]?key|private key/i.test(child)) {
        failures.push(`${label}.${key}_secret_like_pattern_blocked`);
      }
      if (unsafePattern.test(child)) failures.push(`${label}.${key}_private_or_raw_payload`);
    }
    collectUnsafeFailures(child, `${label}.${key}`, failures, seen);
  }
}

function collectForbiddenAuthorityFailures(
  value: unknown,
  label: string,
  failures: string[],
  seen = new WeakSet<object>(),
): void {
  if (!value || typeof value !== "object") return;
  if (seen.has(value)) return;
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      collectForbiddenAuthorityFailures(item, `${label}.${index}`, failures, seen),
    );
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (hasForbiddenAuthorityGrant(key, child)) failures.push(`${label}.${key}_forbidden_authority`);
    collectForbiddenAuthorityFailures(child, `${label}.${key}`, failures, seen);
  }
}

function hasForbiddenAuthorityGrant(key: string, value: unknown): boolean {
  if (allowedTrueAuthorityFields.has(key)) return false;
  if (!isAuthorityKey(key)) return false;
  return !(value === false || value === null || value === undefined);
}

function isAuthorityKey(key: string): boolean {
  if (forbiddenAuthorityFields.has(key)) return true;
  return /(_authority|_write_now|_call_now|_execution_now|_stored_now|_ingested_now|_is_truth|_is_proof|product_write|product_id_allocation|proof_or_evidence|claim_or_evidence|promotion_execution|durable_state_apply|formation_receipt_write|github_api_call|git_write)/.test(key);
}

function statusForFailures(failures: string[]): RuntimeAuditEventWriteStatusV01 {
  if (failures.some((failure) => failure.includes("forbidden_authority"))) {
    return "blocked_forbidden_authority";
  }
  if (failures.some((failure) => /private|raw|secret|local_path|private_url|hidden_reasoning|browser_dump|terminal_log/.test(failure))) {
    return "blocked_private_or_raw_payload";
  }
  return "blocked_invalid_input";
}

function blockedResult(
  status: RuntimeAuditEventWriteStatusV01,
  input: RuntimeAuditEventInputV01,
  failures: string[],
): RuntimeAuditEventWriteResultV01 {
  const safeId =
    typeof input?.audit_event_id === "string" && !unsafePattern.test(input.audit_event_id)
      ? input.audit_event_id
      : null;
  return writeResult(status, safeId, null, false, [
    status,
    ...failures.map((failure) => failure.replace(/[^a-z0-9_.:-]+/gi, "_")).slice(0, 8),
  ]);
}

function writeResult(
  status: RuntimeAuditEventWriteStatusV01,
  auditEventId: string | null,
  fingerprint: string | null,
  persisted: boolean,
  reasonCodes: string[],
): RuntimeAuditEventWriteResultV01 {
  return {
    store_version: RUNTIME_AUDIT_EVENT_STORE_VERSION,
    event_version: RUNTIME_AUDIT_EVENT_VERSION,
    scope,
    status,
    audit_event_id: auditEventId,
    audit_event_ref: auditEventId ? `runtime-audit-event:${auditEventId}` : null,
    event_fingerprint: fingerprint,
    audit_event_persisted: persisted,
    authority_boundary: createRuntimeAuditEventAuthorityBoundaryV01({
      persistenceNow: persisted,
    }),
    reason_codes: uniqueSorted([
      "runtime_audit_panel_runtime_completion",
      "bounded_summary_only",
      "audit_event_is_not_truth",
      "product_write_denied",
      ...reasonCodes,
    ]),
  };
}

function clampLimit(value: unknown): number {
  return typeof value === "number" && Number.isInteger(value)
    ? Math.min(Math.max(value, 1), 200)
    : 100;
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex").slice(0, 16);
}

function stableStringify(value: unknown): string {
  if (value === undefined) return "null";
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value as Record<string, unknown>)
      .filter((key) => (value as Record<string, unknown>)[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

const selectedRuntimeAuditEventTableName = "selected_runtime_audit_events_v01";

export type SelectedRuntimeAuditDbLikeV01 = RuntimeAuditSqliteLikeV01;

type SelectedRuntimeAuditEventRowV01 = {
  audit_event_id: string;
  scope: string;
  event_kind: string;
  event_status: string;
  created_at: string;
  operator_actor_ref: string;
  selected_surface_ref: string;
  event_fingerprint: string;
  event_json: string;
};

type SelectedJsonRecord = Record<string, unknown>;

const selectedRuntimeAuditDefaultCreatedAt = "1970-01-01T00:00:00.000Z" as const;
const selectedRuntimeAuditDefaultOperatorActorRef =
  "operator-ref:selected-runtime-audit-event-store" as const;

const selectedRuntimeAuditAllowedTrueAuthorityFields = new Set([
  "selected_runtime_audit_event_store_now",
  "caller_injected_local_test_db_only",
  "schema_sql_only",
  "selected_surface_only",
  "caller_provided_public_safe_summary_only",
  "audit_event_core_only",
  "linked_refs_are_reference_only",
]);

const selectedRuntimeAuditPrivateBlockReasonCodes = new Set([
  "provider_internal_id_blocked",
  "provider_thread_id_blocked",
  "provider_run_id_blocked",
  "provider_session_id_blocked",
  "private_url_blocked",
  "local_private_path_blocked",
  "credential_marker_blocked",
  "token_marker_blocked",
  "secret_marker_blocked",
  "cookie_marker_blocked",
  "private_key_marker_blocked",
  "raw_source_body_blocked",
  "raw_note_text_blocked",
  "raw_provider_output_blocked",
  "raw_retrieval_output_blocked",
  "raw_db_row_blocked",
  "browser_dump_blocked",
  "hidden_reasoning_blocked",
  "raw_conversation_blocked",
  "canonical_label_from_private_identifier_blocked",
]);

const selectedRuntimeAuditForbiddenAuthorityFieldSet = new Set([
  "audit_event_is_truth",
  "audit_event_is_proof",
  "audit_event_is_accepted_evidence",
  "audit_event_is_approval",
  "audit_event_is_authority",
  "audit_event_is_product_readiness",
  "audit_event_is_release_readiness",
  "audit_event_is_review_memory_write",
  "audit_event_is_promotion",
  "audit_event_is_formation_receipt",
  "audit_event_is_durable_perspective_state",
  "audit_event_is_product_write",
  "audit_event_is_git_github_actuation",
  "audit_event_is_source_fetch",
  "audit_event_is_provider_call",
  "audit_event_is_retrieval_execution",
  "audit_event_is_raw_log_storage",
  "audit_event_fingerprint_is_proof",
  "audit_event_fingerprint_is_approval",
  "validation_pass_is_approval",
  "validation_failure_is_rejection",
  "smoke_pass_is_evidence",
  "smoke_failure_is_rejection",
  "ci_pass_is_authority",
  "ci_failure_is_rejection",
  "skipped_checks_are_automatic_failure",
  "known_warnings_are_automatic_rejection",
  "not_done_items_are_automatic_task_creation",
  "expected_observed_delta_is_approval_or_rejection",
  "route_now",
  "ui_now",
  "component_now",
  "cockpit_change_now",
  "public_surface_change_now",
  "route_model_change_now",
  "broad_all_route_instrumentation_now",
  "global_db_config_now",
  "db_migration_now",
  "local_file_write_now",
  "local_file_read_now",
  "import_apply_now",
  "provider_openai_call_now",
  "prompt_sent_now",
  "source_fetch_now",
  "retrieval_execution_now",
  "retrieval_index_write_now",
  "raw_request_body_stored_now",
  "raw_response_body_stored_now",
  "raw_terminal_log_stored_now",
  "raw_source_body_stored_now",
  "raw_provider_output_stored_now",
  "raw_retrieval_output_stored_now",
  "raw_db_row_stored_now",
  "raw_conversation_stored_now",
  "hidden_reasoning_stored_now",
  "proof_or_evidence_record_now",
  "claim_or_evidence_write_now",
  "review_memory_write_now",
  "promotion_execution_now",
  "promotion_decision_record_write_now",
  "formation_receipt_write_now",
  "durable_state_write_now",
  "durable_state_apply_now",
  "product_write_now",
  "product_id_allocation_now",
  "codex_execution_from_augnes_runtime_now",
  "github_api_call_now",
  "git_write_now",
  "github_git_actuation_now",
  "branch_create_now",
  "commit_create_now",
  "pr_create_now",
  "merge_execute_now",
  "tag_create_now",
  "release_deploy_publish_now",
]);

const selectedRuntimeAuditForbiddenAuthorityPhrasePatterns = [
  /\baudit event\s+(?:is|=|as)\s+(?!not\b)(?:truth|proof|accepted evidence|evidence|approval|authority|product readiness|release readiness|review memory write|promotion|formation receipt|durable perspective state|product-write|product write|git\/github actuation|source fetch|provider call|retrieval execution|raw log storage)\b/i,
  /\baudit event fingerprint\s+(?:is|=|as)\s+(?!not\b)(?:proof|approval|truth|authority|accepted evidence)\b/i,
  /\blinked refs?\s+(?:is|are|=|as)\s+(?!not\b)(?:truth|proof|accepted evidence|approval|authority)\b/i,
  /\bvalidation pass\s+(?:is|=|as)\s+(?!not\b)(?:approval|truth|proof|authority)\b/i,
  /\bvalidation failure\s+(?:is|=|as)\s+(?!not\b)(?:rejection|automatic rejection|truth|proof|authority)\b/i,
  /\bsmoke pass\s+(?:is|=|as)\s+(?!not\b)(?:accepted evidence|evidence|truth|proof|approval|authority)\b/i,
  /\bsmoke failure\s+(?:is|=|as)\s+(?!not\b)(?:rejection|automatic rejection|authority|approval)\b/i,
  /\bci pass\s+(?:is|=|as)\s+(?!not\b)(?:truth|proof|approval|authority|product readiness|release readiness)\b/i,
  /\bci failure\s+(?:is|=|as)\s+(?!not\b)(?:rejection|automatic rejection|truth|proof|authority)\b/i,
  /\bskipped checks?\s+(?:is|are|=|as)\s+(?!not\b)(?:automatic failure|failure|rejection|automatic rejection)\b/i,
  /\bknown warnings?\s+(?:is|are|=|as)\s+(?!not\b)(?:automatic rejection|rejection|failure|automatic failure)\b/i,
  /\bnot[-\s]?done items?\s+(?:is|are|=|as)\s+(?!not\b)(?:automatic task creation|task creation|execution approval)\b/i,
  /\bexpected\/observed delta\s+(?:is|=|as)\s+(?!not\b)(?:approval|rejection|authority|proof|evidence)\b/i,
  /\bpr body\s+(?:is|=|as)\s+(?!not\b)(?:truth|authority|proof|approval)\b/i,
  /\bcodex report\s+(?:is|=|as)\s+(?!not\b)(?:execution approval|truth|proof|accepted evidence|authority|approval)\b/i,
  /\bdogfooding record\s+(?:is|=|as)\s+(?!not\b)(?:truth|proof|authority|approval|source of truth)\b/i,
  /\blocal export manifest\s+(?:is|=|as)\s+(?!not\b)(?:export file|import approval|truth|proof|accepted evidence|approval|authority|release readiness|product readiness)\b/i,
  /\bgit ledger packet\s+(?:is|=|as)\s+(?!not\b)(?:git commit|commit|git write approval|github actuation|pr creation|release approval|deploy approval|publish approval|truth|proof|accepted evidence|approval|authority)\b/i,
  /\bprovider output\s+(?:is|=|as)\s+(?!not\b)(?:truth|proof|accepted evidence|evidence|authority|approval)\b/i,
  /\bretrieval (?:result|score)\s+(?:is|=|as)\s+(?!not\b)(?:accepted evidence|evidence|authority|promotion authority|truth score|truth|promotion readiness|approval)\b/i,
  /\bfeedback\s+(?:is|=|as)\s+(?!not\b)(?:truth|proof|authority|approval)\b/i,
  /\blayout coordinates?\s+(?:is|are|=|as)\s+(?!not\b)(?:truth|authority|source of truth)\b/i,
  /\bsalience score\s+(?:is|=|as)\s+(?!not\b)(?:truth|truth score|authority|promotion readiness)\b/i,
  /\bgit refs?\s+(?:is|are|=|as)\s+(?!not\b)(?:approval|authority|proof|truth|commit approval|write authority)\b/i,
  /\bgithub pr refs?\s+(?:is|are|=|as)\s+(?!not\b)(?:approval|authority|proof|truth|execution approval)\b/i,
] as const;

const selectedRuntimeAuditDefaultForbiddenCapabilities = [
  "Selected audit event store only.",
  "Caller-injected local test DB reads and writes are limited to selected audit events.",
  "UI, route instrumentation, global DB config, provider, retrieval, source-fetch, local file IO, and import apply remain out of scope.",
  "Review Memory, proof/evidence, promotion, Formation Receipt, durable state, and product-write remain out of scope.",
  "Codex, GitHub, Git, tag, release, deploy, and publish execution remain out of scope.",
] as const;

const selectedRuntimeAuditDefaultReasonCodes = [
  "selected_runtime_audit_event_store_present",
  "caller_injected_local_test_db_only",
  "schema_sql_only_no_migration",
  "selected_surface_only",
  "caller_provided_public_safe_summary_only",
  "audit_event_not_truth",
  "audit_event_not_proof",
  "audit_event_not_accepted_evidence",
  "audit_event_not_approval",
  "audit_event_not_authority",
  "audit_event_not_product_readiness",
  "audit_event_not_release_readiness",
  "audit_event_fingerprint_not_proof",
  "audit_event_fingerprint_not_approval",
  "linked_refs_reference_only",
  "validation_pass_not_approval",
  "validation_failure_not_rejection",
  "smoke_pass_not_evidence",
  "smoke_failure_diagnostic_only",
  "ci_pass_not_authority",
  "ci_failure_diagnostic_only",
  "skipped_checks_review_context_only",
  "known_warnings_review_context_only",
  "not_done_items_next_task_cues_only",
  "expected_observed_delta_review_context",
  "product_write_denied",
  "review_memory_not_written",
  "proof_not_created",
  "evidence_not_created",
  "claim_evidence_not_written",
  "promotion_not_executed",
  "formation_receipt_not_written",
  "durable_state_not_applied",
  "git_github_not_executed",
  "provider_call_not_executed",
  "retrieval_not_executed",
  "source_fetch_not_executed",
  "local_file_not_written",
  "local_file_not_read",
  "import_apply_not_executed",
  "release_deploy_publish_not_executed",
  "next_slice_is_cue_not_execution_approval",
] as const;

export const selectedRuntimeAuditEventStoreSchemaSqlV01 = `
CREATE TABLE IF NOT EXISTS ${selectedRuntimeAuditEventTableName} (
  audit_event_id TEXT PRIMARY KEY,
  scope TEXT NOT NULL,
  event_kind TEXT NOT NULL,
  event_status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  operator_actor_ref TEXT NOT NULL,
  selected_surface_ref TEXT NOT NULL,
  event_fingerprint TEXT NOT NULL,
  event_json TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_selected_runtime_audit_events_kind
  ON ${selectedRuntimeAuditEventTableName}(scope, event_kind, created_at, audit_event_id);

CREATE INDEX IF NOT EXISTS idx_selected_runtime_audit_events_operator
  ON ${selectedRuntimeAuditEventTableName}(scope, operator_actor_ref, created_at, audit_event_id);

CREATE INDEX IF NOT EXISTS idx_selected_runtime_audit_events_surface
  ON ${selectedRuntimeAuditEventTableName}(scope, selected_surface_ref, created_at, audit_event_id);
`.trim();

export function ensureSelectedRuntimeAuditEventSchemaV01(
  db: SelectedRuntimeAuditDbLikeV01,
): void {
  db.exec?.(selectedRuntimeAuditEventStoreSchemaSqlV01);
}

export function selectedRuntimeAuditEventSchemaExistsV01(
  db: SelectedRuntimeAuditDbLikeV01,
): boolean {
  const row = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1")
    .get?.(selectedRuntimeAuditEventTableName);
  return Boolean(row);
}

export function createSelectedRuntimeAuditEventAuthorityBoundaryV01():
  SelectedRuntimeAuditEventAuthorityBoundaryV01 {
  return {
    selected_runtime_audit_event_store_now: true,
    caller_injected_local_test_db_only: true,
    schema_sql_only: true,
    selected_surface_only: true,
    caller_provided_public_safe_summary_only: true,
    audit_event_core_only: true,
    route_now: false,
    ui_now: false,
    component_now: false,
    cockpit_change_now: false,
    public_surface_change_now: false,
    route_model_change_now: false,
    broad_all_route_instrumentation_now: false,
    global_db_config_now: false,
    db_migration_now: false,
    local_file_write_now: false,
    local_file_read_now: false,
    import_apply_now: false,
    provider_openai_call_now: false,
    prompt_sent_now: false,
    source_fetch_now: false,
    retrieval_execution_now: false,
    retrieval_index_write_now: false,
    raw_request_body_stored_now: false,
    raw_response_body_stored_now: false,
    raw_terminal_log_stored_now: false,
    raw_source_body_stored_now: false,
    raw_provider_output_stored_now: false,
    raw_retrieval_output_stored_now: false,
    raw_db_row_stored_now: false,
    raw_conversation_stored_now: false,
    hidden_reasoning_stored_now: false,
    proof_or_evidence_record_now: false,
    claim_or_evidence_write_now: false,
    review_memory_write_now: false,
    promotion_execution_now: false,
    promotion_decision_record_write_now: false,
    formation_receipt_write_now: false,
    durable_state_write_now: false,
    durable_state_apply_now: false,
    product_write_now: false,
    product_id_allocation_now: false,
    codex_execution_from_augnes_runtime_now: false,
    github_api_call_now: false,
    git_write_now: false,
    github_git_actuation_now: false,
    branch_create_now: false,
    commit_create_now: false,
    pr_create_now: false,
    merge_execute_now: false,
    tag_create_now: false,
    release_deploy_publish_now: false,
    audit_event_is_truth: false,
    audit_event_is_proof: false,
    audit_event_is_accepted_evidence: false,
    audit_event_is_approval: false,
    audit_event_is_authority: false,
    audit_event_is_product_readiness: false,
    audit_event_is_release_readiness: false,
    audit_event_is_review_memory_write: false,
    audit_event_is_promotion: false,
    audit_event_is_formation_receipt: false,
    audit_event_is_durable_perspective_state: false,
    audit_event_is_product_write: false,
    audit_event_is_git_github_actuation: false,
    audit_event_is_source_fetch: false,
    audit_event_is_provider_call: false,
    audit_event_is_retrieval_execution: false,
    audit_event_is_raw_log_storage: false,
    audit_event_fingerprint_is_proof: false,
    audit_event_fingerprint_is_approval: false,
    linked_refs_are_reference_only: true,
    validation_pass_is_approval: false,
    validation_failure_is_rejection: false,
    smoke_pass_is_evidence: false,
    smoke_failure_is_rejection: false,
    ci_pass_is_authority: false,
    ci_failure_is_rejection: false,
    skipped_checks_are_automatic_failure: false,
    known_warnings_are_automatic_rejection: false,
    not_done_items_are_automatic_task_creation: false,
    expected_observed_delta_is_approval_or_rejection: false,
  };
}

export function buildSelectedRuntimeAuditEventV01(
  input: SelectedRuntimeAuditEventInputV01,
): SelectedRuntimeAuditEventStoreResultV01 {
  if (!selectedIsRecord(input)) {
    return selectedRuntimeAuditResult("rejected", null, null, null, [
      "input_not_object",
      "no_raw_unsafe_echo",
    ]);
  }

  const privacyScanInput = stripSelectedAllowedAuthorityTrueFieldsForPrivacyScan(input);
  const privacyReport = buildPrivacyRedactionRuntimeGuardReportV01(privacyScanInput);
  const forbiddenFindings = detectSelectedRuntimeAuditForbiddenAuthorityFindingsV01(input);
  if (
    privacyReport.status === "blocked_forbidden_authority" ||
    forbiddenFindings.length > 0
  ) {
    const report =
      forbiddenFindings.length > 0
        ? buildSelectedForbiddenAuthorityReportV01(input, forbiddenFindings)
        : selectedPrivacyReportSummary(privacyReport, "blocked_forbidden_authority");
    return selectedRuntimeAuditResult(
      "blocked_forbidden_authority",
      null,
      null,
      report,
      [
        "forbidden_authority_blocked",
        "authority_escalation_blocked",
        "no_raw_unsafe_echo",
      ],
    );
  }
  if (hasSelectedRuntimeAuditPrivateBlockingFinding(privacyReport)) {
    return selectedRuntimeAuditResult(
      "blocked_private_or_raw_payload",
      null,
      null,
      selectedPrivacyReportSummary(privacyReport, "blocked_private_or_raw_payload"),
      ["raw_private_payload_blocked", "no_raw_unsafe_echo"],
    );
  }

  const sourceInput = selectedIsRecord(privacyReport.redacted_preview)
    ? (privacyReport.redacted_preview as SelectedRuntimeAuditEventInputV01)
    : input;
  const normalized = normalizeSelectedRuntimeAuditEventInputV01(sourceInput);
  if (!normalized.ok) {
    return selectedRuntimeAuditResult(
      "rejected",
      normalized.audit_event_id,
      null,
      selectedPrivacyReportSummary(privacyReport, "rejected"),
      normalized.reason_codes,
    );
  }

  const eventWithoutFingerprint: Omit<SelectedRuntimeAuditEventV01, "event_fingerprint"> = {
    audit_event_id:
      normalized.audit_event_id ??
      createSelectedRuntimeAuditEventIdV01(normalized.normalized_input),
    audit_event_version: SelectedRuntimeAuditEventVersionV01,
    store_version: SelectedRuntimeAuditEventStoreVersionV01,
    scope: SelectedRuntimeAuditEventScopeV01,
    event_kind: normalized.normalized_input.event_kind,
    event_status: "recorded",
    created_at: normalized.normalized_input.created_at,
    operator_actor_ref: normalized.normalized_input.operator_actor_ref,
    selected_surface_ref: normalized.normalized_input.selected_surface_ref,
    linked_record_refs: normalized.normalized_input.linked_record_refs,
    linked_candidate_refs: normalized.normalized_input.linked_candidate_refs,
    linked_git_refs: normalized.normalized_input.linked_git_refs,
    linked_github_refs: normalized.normalized_input.linked_github_refs,
    linked_validation_refs: normalized.normalized_input.linked_validation_refs,
    public_safe_summary: normalized.normalized_input.public_safe_summary,
    expected_observed_delta_refs:
      normalized.normalized_input.expected_observed_delta_refs,
    skipped_check_refs: normalized.normalized_input.skipped_check_refs,
    known_warning_refs: normalized.normalized_input.known_warning_refs,
    not_done_refs: normalized.normalized_input.not_done_refs,
    privacy_report: selectedPrivacyReportSummary(privacyReport, "passed"),
    authority_boundary_snapshot:
      createSelectedRuntimeAuditEventAuthorityBoundaryV01(),
    reason_codes: uniqueSorted([
      ...selectedRuntimeAuditDefaultReasonCodes,
      ...normalized.normalized_input.reason_codes,
      SelectedRuntimeAuditEventSliceV01,
      `next_slice:${SelectedRuntimeAuditEventNextSliceV01}`,
    ]),
    lifecycle_state: "candidate_only",
  };
  const event: SelectedRuntimeAuditEventV01 = {
    ...eventWithoutFingerprint,
    event_fingerprint:
      createSelectedRuntimeAuditEventFingerprintV01(eventWithoutFingerprint),
  };
  return selectedRuntimeAuditResult("recorded", event.audit_event_id, event, event.privacy_report, [
    "selected_runtime_audit_event_built",
    "candidate_only_audit_event",
  ]);
}

export function buildRuntimeAuditEventFromSelectedSurfaceV01(
  input: SelectedRuntimeAuditEventInputV01,
): SelectedRuntimeAuditEventStoreResultV01 {
  return buildSelectedRuntimeAuditEventV01(input);
}

export function createSelectedRuntimeAuditEventV01(
  input: SelectedRuntimeAuditEventInputV01,
  db: SelectedRuntimeAuditDbLikeV01,
): SelectedRuntimeAuditEventStoreResultV01 {
  if (!selectedRuntimeAuditEventSchemaExistsV01(db)) {
    return selectedRuntimeAuditResult("schema_missing", null, null, null, [
      "schema_missing",
      "schema_helper_must_be_called_explicitly",
    ]);
  }
  const built = buildSelectedRuntimeAuditEventV01(input);
  if (!built.ok || !built.event) return built;
  return createBuiltSelectedRuntimeAuditEventV01(built.event, db);
}

export function createBuiltSelectedRuntimeAuditEventV01(
  event: SelectedRuntimeAuditEventV01,
  db: SelectedRuntimeAuditDbLikeV01,
): SelectedRuntimeAuditEventStoreResultV01 {
  if (!selectedRuntimeAuditEventSchemaExistsV01(db)) {
    return selectedRuntimeAuditResult("schema_missing", event?.audit_event_id ?? null, null, null, [
      "schema_missing",
      "schema_helper_must_be_called_explicitly",
    ]);
  }
  if (!isSelectedRuntimeAuditEventV01(event)) {
    return selectedRuntimeAuditResult("rejected", null, null, null, [
      "built_event_invalid",
      "no_partial_write",
    ]);
  }
  const existing = readSelectedRuntimeAuditEventRowV01(db, event.audit_event_id);
  if (existing) {
    const existingEvent = selectedRuntimeAuditEventFromRow(existing);
    if (existing.event_fingerprint === event.event_fingerprint && existingEvent) {
      return selectedRuntimeAuditResult(
        "duplicate_event",
        event.audit_event_id,
        existingEvent,
        existingEvent.privacy_report,
        ["duplicate_event", "idempotent_replay", "audit_event_not_duplicated"],
      );
    }
    return selectedRuntimeAuditResult(
      "conflicting_event",
      event.audit_event_id,
      null,
      null,
      ["audit_event_id_conflict", "no_partial_write"],
    );
  }

  db
    .prepare(
      `INSERT INTO ${selectedRuntimeAuditEventTableName} (
        audit_event_id,
        scope,
        event_kind,
        event_status,
        created_at,
        operator_actor_ref,
        selected_surface_ref,
        event_fingerprint,
        event_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run?.(
      event.audit_event_id,
      event.scope,
      event.event_kind,
      event.event_status,
      event.created_at,
      event.operator_actor_ref,
      event.selected_surface_ref,
      event.event_fingerprint,
      stableStringify(event),
    );

  return selectedRuntimeAuditResult(
    "recorded",
    event.audit_event_id,
    event,
    event.privacy_report,
    ["audit_event_recorded", "caller_injected_local_test_db_write_only"],
  );
}

export function readSelectedRuntimeAuditEventV01(
  auditEventId: unknown,
  db: SelectedRuntimeAuditDbLikeV01,
): SelectedRuntimeAuditEventStoreResultV01 {
  if (!selectedRuntimeAuditEventSchemaExistsV01(db)) {
    return selectedRuntimeAuditResult("schema_missing", null, null, null, [
      "schema_missing",
      "read_did_not_create_schema",
    ]);
  }
  const id = selectedPublicString(auditEventId, { maxLength: 240 });
  if (!id) {
    return selectedRuntimeAuditResult("rejected", null, null, null, [
      "audit_event_id_invalid",
      "read_rejected_invalid_id",
    ]);
  }
  const row = readSelectedRuntimeAuditEventRowV01(db, id);
  const event = selectedRuntimeAuditEventFromRow(row);
  if (!event) {
    return selectedRuntimeAuditResult("not_found", id, null, null, [
      "audit_event_not_found",
      "read_only",
    ]);
  }
  return selectedRuntimeAuditResult("read", id, event, event.privacy_report, [
    "audit_event_read",
    "read_only",
  ]);
}

export function listSelectedRuntimeAuditEventsV01(
  filters: SelectedRuntimeAuditEventListFiltersV01,
  db: SelectedRuntimeAuditDbLikeV01,
): SelectedRuntimeAuditEventStoreResultV01 {
  if (!selectedRuntimeAuditEventSchemaExistsV01(db)) {
    return selectedRuntimeAuditResult("schema_missing", null, null, null, [
      "schema_missing",
      "list_did_not_create_schema",
    ]);
  }
  const validationFailures = validateSelectedRuntimeAuditFiltersV01(filters);
  if (validationFailures.length > 0) {
    return selectedRuntimeAuditResult("rejected", null, null, null, validationFailures);
  }
  const value = selectedIsRecord(filters) ? filters : {};
  const clauses = ["scope = ?"];
  const params: unknown[] = [SelectedRuntimeAuditEventScopeV01];
  const eventKind = selectedOptionalEventKind(value.event_kind);
  const eventStatus = selectedOptionalStoreStatus(value.event_status);
  const operatorActorRef = selectedPublicString(value.operator_actor_ref, {
    optional: true,
    maxLength: 240,
  });
  const selectedSurfaceRef = selectedPublicString(value.selected_surface_ref, {
    optional: true,
    maxLength: 240,
  });
  if (eventKind) {
    clauses.push("event_kind = ?");
    params.push(eventKind);
  }
  if (eventStatus) {
    clauses.push("event_status = ?");
    params.push(eventStatus);
  }
  if (operatorActorRef) {
    clauses.push("operator_actor_ref = ?");
    params.push(operatorActorRef);
  }
  if (selectedSurfaceRef) {
    clauses.push("selected_surface_ref = ?");
    params.push(selectedSurfaceRef);
  }
  const limit = selectedClampLimit(value.limit);
  params.push(limit);
  const rows =
    db
      .prepare(
        `SELECT * FROM ${selectedRuntimeAuditEventTableName}
         WHERE ${clauses.join(" AND ")}
         ORDER BY created_at ASC, audit_event_id ASC
         LIMIT ?`,
      )
      .all?.(...params) ?? [];
  const events = rows
    .map((row) => selectedRuntimeAuditEventFromRow(row))
    .filter((event): event is SelectedRuntimeAuditEventV01 => Boolean(event));
  return {
    ...selectedRuntimeAuditResult("listed", null, events[0] ?? null, null, [
      "audit_events_listed",
      "read_only",
    ]),
    events,
  };
}

export function validateSelectedRuntimeAuditFiltersV01(
  filters: unknown,
): string[] {
  if (filters === undefined || filters === null) return [];
  if (!selectedIsRecord(filters)) return ["filters_not_object"];
  const failures: string[] = [];
  if (
    filters.event_kind !== undefined &&
    !selectedOptionalEventKind(filters.event_kind)
  ) {
    failures.push("event_kind_invalid");
  }
  if (
    filters.event_status !== undefined &&
    !selectedOptionalStoreStatus(filters.event_status)
  ) {
    failures.push("event_status_invalid");
  }
  if (
    filters.operator_actor_ref !== undefined &&
    !selectedPublicString(filters.operator_actor_ref, { optional: true, maxLength: 240 })
  ) {
    failures.push("operator_actor_ref_invalid");
  }
  if (
    filters.selected_surface_ref !== undefined &&
    !selectedPublicString(filters.selected_surface_ref, { optional: true, maxLength: 240 })
  ) {
    failures.push("selected_surface_ref_invalid");
  }
  if (
    filters.limit !== undefined &&
    (typeof filters.limit !== "number" ||
      !Number.isInteger(filters.limit) ||
      filters.limit < 1 ||
      filters.limit > 100)
  ) {
    failures.push("limit_invalid");
  }
  const privacyReport = buildPrivacyRedactionRuntimeGuardReportV01(filters);
  if (hasSelectedRuntimeAuditPrivateBlockingFinding(privacyReport)) {
    failures.push("filters_private_or_raw_payload");
  }
  if (detectSelectedRuntimeAuditForbiddenAuthorityFindingsV01(filters).length > 0) {
    failures.push("filters_forbidden_authority");
  }
  return uniqueSorted(failures);
}

export function createSelectedRuntimeAuditEventFingerprintV01(
  eventOrInput: unknown,
): string {
  const clone = selectedCloneJson(eventOrInput);
  if (selectedIsRecord(clone)) {
    delete clone.event_fingerprint;
  }
  return createHash("sha256").update(stableStringify(clone)).digest("hex");
}

export function createSelectedRuntimeAuditEventIdV01(
  input: SelectedRuntimeAuditEventInputV01 | SelectedJsonRecord,
): string {
  const eventKind = selectedEventKind(input.event_kind) ?? "private_raw_payload_blocked";
  const selectedSurfaceRef =
    selectedPublicString(input.selected_surface_ref, { optional: true, maxLength: 160 }) ??
    "selected-surface:unknown";
  const summary =
    selectedPublicString(input.public_safe_summary, { optional: true, maxLength: 300 }) ??
    "selected runtime audit event summary";
  const hash = createHash("sha256")
    .update(
      stableStringify({
        event_kind: eventKind,
        selected_surface_ref: selectedSurfaceRef,
        public_safe_summary: summary,
        linked_record_refs: selectedPublicStringArray(input.linked_record_refs),
        linked_candidate_refs: selectedPublicStringArray(input.linked_candidate_refs),
        created_at:
          selectedPublicString(input.created_at, { optional: true, maxLength: 80 }) ??
          selectedRuntimeAuditDefaultCreatedAt,
      }),
    )
    .digest("hex")
    .slice(0, 16);
  return `runtime-audit:selected:${selectedSafeIdPart(eventKind)}:${selectedSafeIdPart(selectedSurfaceRef)}:${hash}`;
}

function readSelectedRuntimeAuditEventRowV01(
  db: SelectedRuntimeAuditDbLikeV01,
  auditEventId: string,
): SelectedRuntimeAuditEventRowV01 | null {
  const row = db
    .prepare(
      `SELECT * FROM ${selectedRuntimeAuditEventTableName}
       WHERE audit_event_id = ?
       LIMIT 1`,
    )
    .get?.(auditEventId);
  return selectedIsRecord(row) ? (row as SelectedRuntimeAuditEventRowV01) : null;
}

function selectedRuntimeAuditEventFromRow(
  row: unknown,
): SelectedRuntimeAuditEventV01 | null {
  if (!selectedIsRecord(row)) return null;
  if (typeof row.event_json !== "string" || typeof row.event_fingerprint !== "string") {
    return null;
  }
  try {
    const parsed = JSON.parse(row.event_json);
    if (!isSelectedRuntimeAuditEventV01(parsed)) return null;
    return {
      ...parsed,
      event_fingerprint: row.event_fingerprint,
    };
  } catch {
    return null;
  }
}

function isSelectedRuntimeAuditEventV01(
  value: unknown,
): value is SelectedRuntimeAuditEventV01 {
  if (!selectedIsRecord(value)) return false;
  return (
    value.audit_event_version === SelectedRuntimeAuditEventVersionV01 &&
    value.store_version === SelectedRuntimeAuditEventStoreVersionV01 &&
    value.scope === SelectedRuntimeAuditEventScopeV01 &&
    selectedEventKind(value.event_kind) !== null &&
    value.event_status === "recorded" &&
    typeof value.audit_event_id === "string" &&
    typeof value.created_at === "string" &&
    typeof value.operator_actor_ref === "string" &&
    typeof value.selected_surface_ref === "string" &&
    typeof value.public_safe_summary === "string" &&
    typeof value.event_fingerprint === "string" &&
    value.lifecycle_state === "candidate_only"
  );
}

function normalizeSelectedRuntimeAuditEventInputV01(input: SelectedRuntimeAuditEventInputV01):
  | {
      ok: true;
      audit_event_id: string | null;
      normalized_input: {
        event_kind: SelectedRuntimeAuditEventKindV01;
        created_at: string;
        operator_actor_ref: string;
        selected_surface_ref: string;
        linked_record_refs: string[];
        linked_candidate_refs: string[];
        linked_git_refs: string[];
        linked_github_refs: string[];
        linked_validation_refs: string[];
        public_safe_summary: string;
        expected_observed_delta_refs: string[];
        skipped_check_refs: string[];
        known_warning_refs: string[];
        not_done_refs: string[];
        reason_codes: string[];
      };
      reason_codes: string[];
    }
  | { ok: false; audit_event_id: string | null; reason_codes: string[] } {
  const root = selectedIsRecord(input) ? input : {};
  const auditEventId = selectedPublicString(root.audit_event_id, {
    optional: true,
    maxLength: 240,
  });
  const eventKind = selectedEventKind(root.event_kind);
  const createdAt =
    selectedPublicString(root.created_at, { optional: true, maxLength: 80 }) ??
    selectedRuntimeAuditDefaultCreatedAt;
  const operatorActorRef =
    selectedPublicString(root.operator_actor_ref, { optional: true, maxLength: 240 }) ??
    selectedRuntimeAuditDefaultOperatorActorRef;
  const selectedSurfaceRef = selectedPublicString(root.selected_surface_ref, {
    optional: false,
    maxLength: 240,
  });
  const publicSafeSummary = selectedPublicString(root.public_safe_summary, {
    optional: false,
    maxLength: 1200,
  });
  const eventStatus = root.event_status;
  const failures: string[] = [];
  if (root.scope !== undefined && root.scope !== SelectedRuntimeAuditEventScopeV01) {
    failures.push("scope_invalid");
  }
  if (auditEventId === null && root.audit_event_id !== undefined) {
    failures.push("audit_event_id_invalid");
  }
  if (!eventKind) failures.push("event_kind_invalid");
  if (
    eventStatus !== undefined &&
    eventStatus !== null &&
    eventStatus !== "recorded"
  ) {
    failures.push("event_status_invalid");
  }
  if (!selectedSurfaceRef) failures.push("selected_surface_ref_invalid");
  if (!publicSafeSummary) failures.push("public_safe_summary_invalid");
  if (failures.length > 0 || !eventKind || !selectedSurfaceRef || !publicSafeSummary) {
    return {
      ok: false,
      audit_event_id: auditEventId,
      reason_codes: uniqueSorted(["input_shape_invalid", ...failures]),
    };
  }
  return {
    ok: true,
    audit_event_id: auditEventId,
    normalized_input: {
      event_kind: eventKind,
      created_at: createdAt,
      operator_actor_ref: operatorActorRef,
      selected_surface_ref: selectedSurfaceRef,
      linked_record_refs: selectedPublicStringArray(root.linked_record_refs),
      linked_candidate_refs: selectedPublicStringArray(root.linked_candidate_refs),
      linked_git_refs: selectedPublicStringArray(root.linked_git_refs),
      linked_github_refs: selectedPublicStringArray(root.linked_github_refs),
      linked_validation_refs: selectedPublicStringArray(root.linked_validation_refs),
      public_safe_summary: publicSafeSummary,
      expected_observed_delta_refs: selectedPublicStringArray(
        root.expected_observed_delta_refs,
      ),
      skipped_check_refs: selectedPublicStringArray(root.skipped_check_refs),
      known_warning_refs: selectedPublicStringArray(root.known_warning_refs),
      not_done_refs: selectedPublicStringArray(root.not_done_refs),
      reason_codes: selectedPublicStringArray(root.reason_codes),
    },
    reason_codes: [],
  };
}

function selectedRuntimeAuditResult(
  status: SelectedRuntimeAuditEventStatusV01,
  auditEventId: string | null,
  event: SelectedRuntimeAuditEventV01 | null,
  privacyReport: SelectedRuntimeAuditEventPrivacyReportV01 | null,
  reasonCodes: string[],
): SelectedRuntimeAuditEventStoreResultV01 {
  const ok = status === "recorded" || status === "duplicate_event" || status === "listed" || status === "read";
  return {
    ok,
    status,
    error_code: ok ? null : status,
    event,
    events: event ? [event] : [],
    audit_event_id: auditEventId,
    event_fingerprint: event?.event_fingerprint ?? null,
    reason_codes: uniqueSorted([
      ...selectedRuntimeAuditDefaultReasonCodes,
      ...reasonCodes,
    ]),
    privacy_report: privacyReport,
    authority_boundary: createSelectedRuntimeAuditEventAuthorityBoundaryV01(),
    product_write_executed: false,
    proof_or_evidence_created: false,
    accepted_evidence_created: false,
    claim_or_evidence_written: false,
    review_memory_written: false,
    promotion_executed: false,
    formation_receipt_written: false,
    durable_state_applied: false,
    github_api_called: false,
    git_write_executed: false,
    github_git_actuated: false,
    provider_called: false,
    retrieval_executed: false,
    source_fetched: false,
    local_file_written: false,
    local_file_read: false,
    import_apply_executed: false,
    release_deploy_publish_executed: false,
    raw_request_body_stored: false,
    raw_response_body_stored: false,
    raw_terminal_log_stored: false,
  };
}

function selectedPrivacyReportSummary(
  report: PrivacyRedactionRuntimeGuardReport,
  fallbackStatus: string,
): SelectedRuntimeAuditEventPrivacyReportV01 {
  return {
    status: report.status ?? fallbackStatus,
    findings: report.findings.map((finding) => ({
      finding_id: finding.finding_id,
      path: finding.path,
      finding_kind: finding.finding_kind,
      severity: finding.severity,
      action: finding.action,
      reason_codes: finding.reason_codes,
      public_safe_summary: finding.public_safe_summary,
      original_value_included: false,
    })),
    blocked_paths: report.blocked_paths,
    redacted_paths: report.redacted_paths,
    reason_codes: report.reason_codes,
    boundary_notes: report.boundary_notes,
  };
}

function buildSelectedForbiddenAuthorityReportV01(
  input: unknown,
  findings: PrivacyRedactionRuntimeGuardFinding[],
): SelectedRuntimeAuditEventPrivacyReportV01 {
  const reportWithoutFingerprint = {
    guard_version: PRIVACY_REDACTION_RUNTIME_GUARD_VERSION,
    scope: SelectedRuntimeAuditEventScopeV01,
    status: "blocked_forbidden_authority" as const,
    as_of:
      selectedIsRecord(input) &&
      typeof input.created_at === "string" &&
      input.created_at.trim().length > 0
        ? input.created_at.trim()
        : selectedRuntimeAuditDefaultCreatedAt,
    subject_ref: "selected-runtime-audit-event:blocked",
    findings,
    redacted_preview: {
      status: "blocked_forbidden_authority",
      public_safe_summary_only: true,
    },
    blocked_paths: uniqueSorted(findings.map((finding) => finding.path)),
    redacted_paths: [],
    reason_codes: [
      "authority_escalation_blocked",
      "public_safe_summary_only",
    ] as PrivacyRedactionRuntimeGuardReport["reason_codes"],
    boundary_notes: [
      "Forbidden authority shortcuts are blocked without raw value echo.",
      "Selected runtime audit events remain candidate-only public-safe summaries.",
    ],
    authority_boundary: createPrivacyRedactionRuntimeGuardAuthorityBoundaryV01(),
  };
  const report: PrivacyRedactionRuntimeGuardReport = {
    ...reportWithoutFingerprint,
    guard_fingerprint:
      createPrivacyRedactionRuntimeGuardFingerprintV01(reportWithoutFingerprint),
  };
  return selectedPrivacyReportSummary(report, "blocked_forbidden_authority");
}

function detectSelectedRuntimeAuditForbiddenAuthorityFindingsV01(
  input: unknown,
): PrivacyRedactionRuntimeGuardFinding[] {
  const findings: Array<Omit<PrivacyRedactionRuntimeGuardFinding, "finding_id">> = [];
  selectedVisitValue(input, "input", (path, value, key) => {
    if (key && isSelectedRuntimeAuditForbiddenAuthorityField(key, value)) {
      findings.push({
        path,
        finding_kind: "forbidden_authority_claim",
        severity: "critical",
        action: "blocked",
        reason_codes: ["authority_escalation_blocked", "public_safe_summary_only"],
        public_safe_summary:
          "Forbidden authority claim was blocked; no raw value included.",
        original_value_included: false,
      });
    }
    if (typeof value !== "string") return;
    for (const pattern of selectedRuntimeAuditForbiddenAuthorityPhrasePatterns) {
      pattern.lastIndex = 0;
      if (!pattern.test(value)) continue;
      findings.push({
        path,
        finding_kind: "forbidden_authority_phrase",
        severity: "critical",
        action: "blocked",
        reason_codes: ["authority_escalation_blocked", "public_safe_summary_only"],
        public_safe_summary:
          "Forbidden authority phrase was blocked; no raw value included.",
        original_value_included: false,
      });
    }
  });
  return findings.map((finding, index) => ({
    finding_id: `selected-runtime-audit-authority-finding-${String(index + 1).padStart(3, "0")}`,
    ...finding,
  }));
}

function hasSelectedRuntimeAuditPrivateBlockingFinding(
  report: PrivacyRedactionRuntimeGuardReport,
): boolean {
  return report.findings.some((finding) =>
    finding.reason_codes.some((reasonCode) =>
      selectedRuntimeAuditPrivateBlockReasonCodes.has(reasonCode),
    ),
  );
}

function isSelectedRuntimeAuditForbiddenAuthorityField(
  key: string,
  value: unknown,
): boolean {
  if (value === false || value === null || value === undefined) return false;
  const lower = key.toLowerCase();
  if (selectedRuntimeAuditAllowedTrueAuthorityFields.has(lower)) return false;
  return (
    selectedRuntimeAuditForbiddenAuthorityFieldSet.has(lower) ||
    lower.endsWith("_authority") ||
    lower.endsWith("_authority_now") ||
    lower.endsWith("_write_now") ||
    lower.endsWith("_read_now") ||
    lower.endsWith("_call_now") ||
    lower.endsWith("_execution_now") ||
    lower.endsWith("_apply_now") ||
    lower.endsWith("_stored_now") ||
    lower.endsWith("_is_truth") ||
    lower.endsWith("_is_proof") ||
    lower.endsWith("_is_approval") ||
    lower.endsWith("_is_authority") ||
    lower.endsWith("_is_rejection") ||
    lower.includes("product_write") ||
    lower.includes("proof_or_evidence") ||
    lower.includes("claim_or_evidence")
  );
}

function stripSelectedAllowedAuthorityTrueFieldsForPrivacyScan(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => stripSelectedAllowedAuthorityTrueFieldsForPrivacyScan(item));
  }
  if (!selectedIsRecord(value)) return value;
  return Object.keys(value)
    .sort()
    .reduce<SelectedJsonRecord>((acc, key) => {
      const child = value[key];
      if (
        selectedRuntimeAuditAllowedTrueAuthorityFields.has(key.toLowerCase()) &&
        (child === true || child === false)
      ) {
        acc[key] = false;
        return acc;
      }
      acc[key] = stripSelectedAllowedAuthorityTrueFieldsForPrivacyScan(child);
      return acc;
    }, {});
}

function selectedOptionalEventKind(
  value: unknown,
): SelectedRuntimeAuditEventKindV01 | null {
  if (value === undefined || value === null || value === "") return null;
  return selectedEventKind(value);
}

function selectedEventKind(value: unknown): SelectedRuntimeAuditEventKindV01 | null {
  return typeof value === "string" &&
    (SelectedRuntimeAuditEventKindsV01 as readonly string[]).includes(value)
    ? (value as SelectedRuntimeAuditEventKindV01)
    : null;
}

function selectedOptionalStoreStatus(
  value: unknown,
): SelectedRuntimeAuditEventStatusV01 | null {
  if (value === undefined || value === null || value === "") return null;
  return typeof value === "string" &&
    ["recorded", "duplicate_event", "blocked_private_or_raw_payload", "blocked_forbidden_authority"].includes(value)
    ? (value as SelectedRuntimeAuditEventStatusV01)
    : null;
}

function selectedPublicString(
  value: unknown,
  options: { optional?: boolean; maxLength: number },
): string | null {
  if ((value === undefined || value === null || value === "") && options.optional) {
    return null;
  }
  if (typeof value !== "string") return null;
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (trimmed.length === 0 || trimmed.length > options.maxLength) return null;
  return trimmed;
}

function selectedPublicStringArray(value: unknown): string[] {
  const rawItems = Array.isArray(value)
    ? value
    : value === undefined || value === null
      ? []
      : [value];
  return uniqueSorted(
    rawItems
      .map((item) => selectedPublicString(item, { optional: true, maxLength: 300 }))
      .filter((item): item is string => Boolean(item)),
  ).slice(0, 50);
}

function selectedClampLimit(value: unknown): number {
  return typeof value === "number" && Number.isInteger(value)
    ? Math.min(Math.max(value, 1), 100)
    : 50;
}

function selectedSafeIdPart(value: string): string {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return normalized || "ref";
}

function selectedCloneJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(selectedCloneJson);
  if (selectedIsRecord(value)) {
    return Object.keys(value)
      .sort()
      .reduce<SelectedJsonRecord>((acc, key) => {
        const child = selectedCloneJson(value[key]);
        if (child !== undefined) acc[key] = child;
        return acc;
      }, {});
  }
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  return null;
}

function selectedVisitValue(
  value: unknown,
  path: string,
  visitor: (path: string, value: unknown, key?: string) => void,
  key?: string,
): void {
  visitor(path, value, key);
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      selectedVisitValue(item, `${path}[${index}]`, visitor);
    });
    return;
  }
  if (!selectedIsRecord(value)) return;
  for (const key of Object.keys(value).sort()) {
    selectedVisitValue(
      value[key],
      `${path}.${key.replace(/[^A-Za-z0-9_.:-]+/g, "_")}`,
      visitor,
      key,
    );
  }
}

function selectedIsRecord(value: unknown): value is SelectedJsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export const selectedRuntimeAuditEventForbiddenCapabilitiesV01 = [
  ...selectedRuntimeAuditDefaultForbiddenCapabilities,
];
