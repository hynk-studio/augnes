import type {
  FeedbackEventStoreAuthorityBoundary,
  FeedbackEventStoreEvent,
  FeedbackEventStoreEventType,
  FeedbackEventStoreInput,
  FeedbackEventStoreListResult,
  FeedbackEventStoreTargetKind,
  FeedbackEventStoreValidationResult,
  FeedbackEventStoreWriteResult,
} from "@/types/feedback-event-store";

type JsonRecord = Record<string, unknown>;

interface FeedbackEventStoreDbStatement {
  get?: (...values: unknown[]) => unknown;
  all?: (...values: unknown[]) => unknown[];
  run?: (...values: unknown[]) => { changes?: number };
}

interface FeedbackEventStoreDb {
  prepare(sql: string): FeedbackEventStoreDbStatement;
}

export const feedbackEventStoreTableName = "research_candidate_feedback_events";

export const feedbackEventStoreSchemaSql = `
CREATE TABLE IF NOT EXISTS research_candidate_feedback_events (
  event_id TEXT PRIMARY KEY,
  event_version TEXT NOT NULL,
  event_type TEXT NOT NULL,
  target_kind TEXT NOT NULL,
  target_id TEXT NOT NULL,
  target_fingerprint TEXT,
  source_ref_ids_json TEXT NOT NULL,
  operator_note TEXT,
  correction_text TEXT,
  reason TEXT,
  created_at TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  authority_boundary_json TEXT NOT NULL,
  event_json TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_research_candidate_feedback_events_event_type
  ON research_candidate_feedback_events(event_type);

CREATE INDEX IF NOT EXISTS idx_research_candidate_feedback_events_target
  ON research_candidate_feedback_events(target_kind, target_id);

CREATE INDEX IF NOT EXISTS idx_research_candidate_feedback_events_created_at
  ON research_candidate_feedback_events(created_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_feedback_events_idempotency
  ON research_candidate_feedback_events(idempotency_key);
`.trim();

const eventVersion = "feedback_event_store.v0.1";
const defaultCreatedAt = "1970-01-01T00:00:00.000Z";

const allowedEventTypes: FeedbackEventStoreEventType[] = [
  "dismiss_preview",
  "pin_preview",
  "correct_preview",
  "invalidate_preview",
];

const allowedTargetKinds: FeedbackEventStoreTargetKind[] = [
  "agent_perspective_substrate_surfacing_card",
  "agent_perspective_substrate_folded_section",
  "candidate_to_codex_handoff_draft",
  "candidate_to_codex_handoff_draft_review",
  "candidate_to_codex_handoff_operator_decision_preview",
  "research_candidate_review_object",
  "research_candidate_ai_context_packet",
  "perspective_geometry_digest",
];

const forbiddenOperatorNotePatterns = [
  /sk-[A-Za-z0-9_-]{8,}/,
  /OPENAI_API_KEY/i,
  /GITHUB_TOKEN/i,
  /ghp_[A-Za-z0-9_]+/,
  /password\s*[:=]/i,
  /secret\s*[:=]/i,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
];

export function normalizeFeedbackEventStoreInput(
  input: FeedbackEventStoreInput,
): FeedbackEventStoreInput {
  const normalized: FeedbackEventStoreInput = {
    event_type: input.event_type,
    target_kind: input.target_kind,
    target_id: normalizeString(input.target_id),
    source_ref_ids: normalizeStringArray(input.source_ref_ids ?? []),
    created_at: input.created_at ?? defaultCreatedAt,
  };
  assignOptionalString(normalized, "target_fingerprint", input.target_fingerprint);
  assignOptionalString(normalized, "operator_note", input.operator_note);
  assignOptionalString(normalized, "correction_text", input.correction_text);
  assignOptionalString(normalized, "reason", input.reason);
  normalized.idempotency_key =
    normalizeString(input.idempotency_key) ||
    createFeedbackEventStoreIdempotencyKey(normalized);
  return normalized;
}

export function buildFeedbackEventStoreEvent(
  input: FeedbackEventStoreInput,
): FeedbackEventStoreEvent {
  const normalized = normalizeFeedbackEventStoreInput(input);
  const event: FeedbackEventStoreEvent = {
    event_id: createFeedbackEventStoreEventId(normalized),
    event_version: eventVersion,
    event_type: normalized.event_type,
    target_kind: normalized.target_kind,
    target_id: normalized.target_id,
    source_ref_ids: normalized.source_ref_ids ?? [],
    created_at: normalized.created_at ?? defaultCreatedAt,
    idempotency_key:
      normalized.idempotency_key ??
      createFeedbackEventStoreIdempotencyKey(normalized),
    authority_boundary: getFeedbackEventStoreAuthorityBoundary(),
  };
  assignOptionalString(event, "target_fingerprint", normalized.target_fingerprint);
  assignOptionalString(event, "operator_note", normalized.operator_note);
  assignOptionalString(event, "correction_text", normalized.correction_text);
  assignOptionalString(event, "reason", normalized.reason);
  return event;
}

export function validateFeedbackEventStoreEvent(
  event: FeedbackEventStoreEvent,
): FeedbackEventStoreValidationResult {
  const failureCodes: string[] = [];
  if (event.event_version !== eventVersion) {
    failureCodes.push("event_version_invalid");
  }
  if (!allowedEventTypes.includes(event.event_type)) {
    failureCodes.push("event_type_invalid");
  }
  if (!allowedTargetKinds.includes(event.target_kind)) {
    failureCodes.push("target_kind_invalid");
  }
  if (!normalizeString(event.target_id)) {
    failureCodes.push("target_id_missing");
  }
  if (!Array.isArray(event.source_ref_ids)) {
    failureCodes.push("source_ref_ids_not_array");
  }
  if (
    Array.isArray(event.source_ref_ids) &&
    event.source_ref_ids.length === 0 &&
    !normalizeString(event.reason)
  ) {
    failureCodes.push("source_ref_ids_empty_without_reason");
  }
  if (event.event_type === "correct_preview" && !normalizeString(event.correction_text)) {
    failureCodes.push("correction_text_required_for_correct_preview");
  }
  if (operatorNoteContainsSecret(event.operator_note)) {
    failureCodes.push("operator_note_contains_secret_like_pattern");
  }
  if (!authorityBoundaryIsSafe(event.authority_boundary)) {
    failureCodes.push("authority_boundary_forbidden_capability_enabled");
  }
  if (!normalizeString(event.event_id)) {
    failureCodes.push("event_id_missing");
  }
  if (!normalizeString(event.idempotency_key)) {
    failureCodes.push("idempotency_key_missing");
  }
  if (!normalizeString(event.created_at)) {
    failureCodes.push("created_at_missing");
  }
  return {
    passed: failureCodes.length === 0,
    failure_codes: uniqueSorted(failureCodes),
  };
}

export function createFeedbackEventStoreEventId(
  input: FeedbackEventStoreInput,
): string {
  const normalized = normalizeInputForKey(input);
  return `feedback_event:fnv1a32:${fnv1a32(
    canonicalJson({
      event_type: normalized.event_type,
      target_kind: normalized.target_kind,
      target_id: normalized.target_id,
      created_at: normalized.created_at,
      idempotency_key:
        normalizeString(input.idempotency_key) ||
        createFeedbackEventStoreIdempotencyKey(normalized),
    }),
  )}`;
}

export function createFeedbackEventStoreIdempotencyKey(
  input: FeedbackEventStoreInput,
): string {
  const suppliedKey = normalizeString(input.idempotency_key);
  if (suppliedKey) return suppliedKey;
  return `feedback_event_store_idempotency:fnv1a32:${fnv1a32(
    canonicalJson(normalizeInputForKey(input)),
  )}`;
}

export function insertFeedbackEvent(
  db: FeedbackEventStoreDb,
  event: FeedbackEventStoreEvent,
): FeedbackEventStoreWriteResult {
  const validation = validateFeedbackEventStoreEvent(event);
  if (!validation.passed) {
    return {
      inserted: false,
      duplicate: false,
      event: null,
      validation,
      row_count: countRows(db),
    };
  }

  const existing = selectEventByIdempotencyKey(db, event.idempotency_key);
  if (existing) {
    return {
      inserted: false,
      duplicate: true,
      event: existing,
      validation,
      row_count: countRows(db),
    };
  }

  const result = db
    .prepare(
      `INSERT OR IGNORE INTO ${feedbackEventStoreTableName} (
        event_id,
        event_version,
        event_type,
        target_kind,
        target_id,
        target_fingerprint,
        source_ref_ids_json,
        operator_note,
        correction_text,
        reason,
        created_at,
        idempotency_key,
        authority_boundary_json,
        event_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run?.(
      event.event_id,
      event.event_version,
      event.event_type,
      event.target_kind,
      event.target_id,
      event.target_fingerprint ?? null,
      JSON.stringify(event.source_ref_ids),
      event.operator_note ?? null,
      event.correction_text ?? null,
      event.reason ?? null,
      event.created_at,
      event.idempotency_key,
      JSON.stringify(event.authority_boundary),
      canonicalJson(event),
    );

  if (!result || result.changes !== 1) {
    const duplicate = selectEventByIdempotencyKey(db, event.idempotency_key);
    return {
      inserted: false,
      duplicate: duplicate !== null,
      event: duplicate ?? event,
      validation,
      row_count: countRows(db),
    };
  }

  return {
    inserted: true,
    duplicate: false,
    event,
    validation,
    row_count: countRows(db),
  };
}

export function listFeedbackEvents(
  db: FeedbackEventStoreDb,
  filters: {
    event_type?: FeedbackEventStoreEventType;
    target_kind?: FeedbackEventStoreTargetKind;
    target_id?: string;
  } = {},
): FeedbackEventStoreListResult {
  const clauses: string[] = [];
  const values: unknown[] = [];
  if (filters.event_type) {
    clauses.push("event_type = ?");
    values.push(filters.event_type);
  }
  if (filters.target_kind) {
    clauses.push("target_kind = ?");
    values.push(filters.target_kind);
  }
  if (filters.target_id) {
    clauses.push("target_id = ?");
    values.push(filters.target_id);
  }
  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows =
    db
      .prepare(
        `SELECT event_json FROM ${feedbackEventStoreTableName} ${where}
         ORDER BY created_at ASC, event_id ASC`,
      )
      .all?.(...values) ?? [];
  const events = rows
    .map((row) => eventFromRow(row))
    .filter((event): event is FeedbackEventStoreEvent => event !== null);
  return {
    events,
    filters: {
      ...(filters.event_type ? { event_type: filters.event_type } : {}),
      ...(filters.target_kind ? { target_kind: filters.target_kind } : {}),
      ...(filters.target_id ? { target_id: filters.target_id } : {}),
    },
    row_count: events.length,
  };
}

export function getFeedbackEventStoreAuthorityBoundary(): FeedbackEventStoreAuthorityBoundary {
  return {
    durable_feedback_event: true,
    proof_or_evidence_record: false,
    perspective_promotion: false,
    work_mutation: false,
    execution_authority: false,
    codex_execution_authority: false,
    github_automation_authority: false,
    external_handoff_authority: false,
    provider_openai_authority: false,
    retrieval_rag_authority: false,
    source_fetch_authority: false,
    product_write_authority: false,
    product_id_allocation_authority: false,
  };
}

function normalizeInputForKey(input: FeedbackEventStoreInput): FeedbackEventStoreInput {
  const normalized: FeedbackEventStoreInput = {
    event_type: input.event_type,
    target_kind: input.target_kind,
    target_id: normalizeString(input.target_id),
    source_ref_ids: normalizeStringArray(input.source_ref_ids ?? []),
    created_at: input.created_at ?? defaultCreatedAt,
  };
  assignOptionalString(normalized, "target_fingerprint", input.target_fingerprint);
  assignOptionalString(normalized, "operator_note", input.operator_note);
  assignOptionalString(normalized, "correction_text", input.correction_text);
  assignOptionalString(normalized, "reason", input.reason);
  return normalized;
}

function authorityBoundaryIsSafe(
  boundary: FeedbackEventStoreAuthorityBoundary,
): boolean {
  if (!boundary || typeof boundary !== "object") return false;
  if (boundary.durable_feedback_event !== true) return false;
  for (const key of [
    "proof_or_evidence_record",
    "perspective_promotion",
    "work_mutation",
    "execution_authority",
    "codex_execution_authority",
    "github_automation_authority",
    "external_handoff_authority",
    "provider_openai_authority",
    "retrieval_rag_authority",
    "source_fetch_authority",
    "product_write_authority",
    "product_id_allocation_authority",
  ] as const) {
    if (boundary[key] !== false) return false;
  }
  return true;
}

function operatorNoteContainsSecret(value: unknown): boolean {
  if (typeof value !== "string") return false;
  return forbiddenOperatorNotePatterns.some((pattern) => pattern.test(value));
}

function selectEventByIdempotencyKey(
  db: FeedbackEventStoreDb,
  idempotencyKey: string,
): FeedbackEventStoreEvent | null {
  const row = db
    .prepare(
      `SELECT event_json FROM ${feedbackEventStoreTableName}
       WHERE idempotency_key = ? LIMIT 1`,
    )
    .get?.(idempotencyKey);
  return eventFromRow(row);
}

function countRows(db: FeedbackEventStoreDb): number {
  const row = db
    .prepare(`SELECT COUNT(*) AS count FROM ${feedbackEventStoreTableName}`)
    .get?.();
  if (!row || typeof row !== "object") return 0;
  const count = (row as JsonRecord).count;
  return typeof count === "number" ? count : 0;
}

function eventFromRow(row: unknown): FeedbackEventStoreEvent | null {
  if (!row || typeof row !== "object") return null;
  const eventJson = (row as JsonRecord).event_json;
  if (typeof eventJson !== "string") return null;
  try {
    return JSON.parse(eventJson) as FeedbackEventStoreEvent;
  } catch {
    return null;
  }
}

function assignOptionalString<T extends object>(
  target: T,
  key: keyof T,
  value: unknown,
): void {
  const normalized = normalizeString(value);
  if (normalized) {
    (target as Record<string, unknown>)[String(key)] = normalized;
  }
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeStringArray(values: unknown[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => normalizeString(value))
        .filter((value) => value.length > 0),
    ),
  ).sort();
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort();
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value as JsonRecord)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson((value as JsonRecord)[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function fnv1a32(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
