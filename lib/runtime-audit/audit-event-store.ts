import { createHash } from "node:crypto";

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
