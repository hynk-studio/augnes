import { randomUUID } from "node:crypto";
import { openDatabase } from "@/lib/db";

const DEFAULT_SCOPE = "project:augnes";
const DEFAULT_EVENT_LIMIT = 50;
const MAX_EVENT_LIMIT = 200;

export const COORDINATION_EVENT_TYPES = [
  "handoff_created",
  "handoff_ready",
  "handoff_delivered",
  "handoff_acknowledged",
  "work_event_recorded",
  "action_result_recorded",
  "result_review_created",
  "record_draft_created",
  "publication_draft_created",
  "publication_sent",
  "publication_failed",
  "publication_acknowledged",
  "mailbox_message_created",
  "mailbox_message_delivered",
  "mailbox_message_acknowledged",
  "mailbox_message_reviewed",
  "mailbox_message_superseded",
  "mailbox_message_expired",
] as const;

export const COORDINATION_AUTHORITY_LEVELS = [
  "raw_observation",
  "interpretation_only",
  "handoff_guidance",
  "execution_trace",
  "action_proof",
  "publication_notice",
  "acknowledged_notice",
  "committed_state",
] as const;

export type CoordinationEventType = (typeof COORDINATION_EVENT_TYPES)[number];
export type CoordinationAuthorityLevel =
  (typeof COORDINATION_AUTHORITY_LEVELS)[number];

export type CoordinationEvent = {
  event_id: string;
  event_type: CoordinationEventType | string;
  scope: string;
  work_id: string | null;
  actor: string;
  target: string | null;
  source_surface: string;
  authority_level: CoordinationAuthorityLevel | string;
  state_keys: string[];
  causal_parent_id: string | null;
  payload_ref: string | null;
  result_status: string | null;
  created_at: string;
};

export type CoordinationEventInput = {
  event_id?: string;
  event_type: CoordinationEventType;
  scope?: string | null;
  work_id?: string | null;
  actor: string;
  target?: string | null;
  source_surface: string;
  authority_level: CoordinationAuthorityLevel;
  state_keys?: string[];
  causal_parent_id?: string | null;
  payload_ref?: string | null;
  result_status?: string | null;
  created_at?: string;
};

type CoordinationEventRow = Omit<CoordinationEvent, "state_keys"> & {
  state_keys: string;
};

export function listCoordinationEvents({
  scope = DEFAULT_SCOPE,
  workId,
  eventType,
  limit = DEFAULT_EVENT_LIMIT,
}: {
  scope?: string | null;
  workId?: string | null;
  eventType?: CoordinationEventType | null;
  limit?: number;
}) {
  const normalizedScope = normalizeScope(scope);
  const params: Array<string | number> = [normalizedScope];
  const clauses = ["scope = ?"];

  if (workId) {
    clauses.push("work_id = ?");
    params.push(normalizeWorkId(workId));
  }

  if (eventType) {
    assertEnum(eventType, COORDINATION_EVENT_TYPES, "event_type");
    clauses.push("event_type = ?");
    params.push(eventType);
  }

  params.push(normalizeLimit(limit));
  const db = openDatabase();

  try {
    const rows = db
      .prepare(
        `
          SELECT
            event_id,
            event_type,
            scope,
            work_id,
            actor,
            target,
            source_surface,
            authority_level,
            state_keys,
            causal_parent_id,
            payload_ref,
            result_status,
            created_at
          FROM coordination_events
          WHERE ${clauses.join(" AND ")}
          ORDER BY created_at DESC, event_id ASC
          LIMIT ?
        `,
      )
      .all(...params) as CoordinationEventRow[];

    return rows.map(parseCoordinationEventRow);
  } finally {
    db.close();
  }
}

export function getCoordinationEvent(eventId: string, scope?: string | null) {
  const db = openDatabase();

  try {
    const normalizedScope = scope ? normalizeScope(scope) : null;
    const row = db
      .prepare(
        `
          SELECT
            event_id,
            event_type,
            scope,
            work_id,
            actor,
            target,
            source_surface,
            authority_level,
            state_keys,
            causal_parent_id,
            payload_ref,
            result_status,
            created_at
          FROM coordination_events
          WHERE event_id = ?
            ${normalizedScope ? "AND scope = ?" : ""}
        `,
      )
      .get(
        ...([eventId, normalizedScope].filter(Boolean) as string[]),
      ) as CoordinationEventRow | undefined;

    return row ? parseCoordinationEventRow(row) : null;
  } finally {
    db.close();
  }
}

export function appendCoordinationEvent(input: CoordinationEventInput) {
  assertEnum(input.event_type, COORDINATION_EVENT_TYPES, "event_type");
  assertEnum(
    input.authority_level,
    COORDINATION_AUTHORITY_LEVELS,
    "authority_level",
  );

  const row = {
    event_id: input.event_id ?? `event:${randomUUID()}`,
    event_type: input.event_type,
    scope: normalizeScope(input.scope),
    work_id: input.work_id ? normalizeWorkId(input.work_id) : null,
    actor: requireNonEmptyString(input.actor, "actor"),
    target: cleanNullableString(input.target),
    source_surface: requireNonEmptyString(input.source_surface, "source_surface"),
    authority_level: input.authority_level,
    state_keys: stringifyStringArray(input.state_keys ?? []),
    causal_parent_id: cleanNullableString(input.causal_parent_id),
    payload_ref: cleanNullableString(input.payload_ref),
    result_status: cleanNullableString(input.result_status),
    created_at: input.created_at ?? new Date().toISOString(),
  };
  const db = openDatabase();

  try {
    db.prepare(
      `
        INSERT OR IGNORE INTO coordination_events (
          event_id,
          event_type,
          scope,
          work_id,
          actor,
          target,
          source_surface,
          authority_level,
          state_keys,
          causal_parent_id,
          payload_ref,
          result_status,
          created_at
        )
        VALUES (
          @event_id,
          @event_type,
          @scope,
          @work_id,
          @actor,
          @target,
          @source_surface,
          @authority_level,
          @state_keys,
          @causal_parent_id,
          @payload_ref,
          @result_status,
          @created_at
        )
      `,
    ).run(row);

    const inserted = db
      .prepare(
        `
          SELECT
            event_id,
            event_type,
            scope,
            work_id,
            actor,
            target,
            source_surface,
            authority_level,
            state_keys,
            causal_parent_id,
            payload_ref,
            result_status,
            created_at
          FROM coordination_events
          WHERE event_id = ?
        `,
      )
      .get(row.event_id) as CoordinationEventRow;

    return parseCoordinationEventRow(inserted);
  } finally {
    db.close();
  }
}

function parseCoordinationEventRow(row: CoordinationEventRow): CoordinationEvent {
  return {
    ...row,
    state_keys: parseStringArray(row.state_keys),
  };
}

function parseStringArray(value: string | null): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function stringifyStringArray(value: string[]) {
  return JSON.stringify(
    uniqueStrings(value.map((item) => item.trim()).filter(Boolean)),
  );
}

function uniqueStrings(values: string[]) {
  return [...new Set(values)];
}

function normalizeLimit(limit: number) {
  if (!Number.isFinite(limit)) {
    return DEFAULT_EVENT_LIMIT;
  }

  return Math.min(MAX_EVENT_LIMIT, Math.max(1, Math.floor(limit)));
}

function assertEnum<T extends string>(
  value: string,
  allowed: readonly T[],
  key: string,
): asserts value is T {
  if (!allowed.includes(value as T)) {
    throw new Error(`${key} must be one of: ${allowed.join(", ")}.`);
  }
}

function requireNonEmptyString(value: string, key: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${key} is required.`);
  }

  return value.trim();
}

function cleanNullableString(value: string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  return value.trim() || null;
}

function normalizeWorkId(workId: string) {
  return workId.trim().toUpperCase();
}

function normalizeScope(scope?: string | null) {
  return scope?.trim() || DEFAULT_SCOPE;
}
