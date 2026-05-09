import { randomUUID } from "node:crypto";
import { appendCoordinationEvent } from "@/lib/coordination-events";
import { openDatabase, type StateValue } from "@/lib/db";
import { normalizeScope, normalizeWorkId } from "@/lib/work";

const DEFAULT_HANDOFF_LIMIT = 50;
const MAX_HANDOFF_LIMIT = 200;

export const HANDOFF_STATUSES = [
  "draft",
  "ready",
  "delivered",
  "acknowledged",
  "reviewed",
  "superseded",
  "expired",
] as const;

export type HandoffStatus = (typeof HANDOFF_STATUSES)[number];

export type HandoffRecord = {
  handoff_id: string;
  scope: string;
  work_id: string | null;
  source_state_brief_ref: string | null;
  source_work_brief_ref: string | null;
  target_agent: string;
  status: HandoffStatus | string;
  current_committed_state_summary: string;
  task_brief: string;
  expected_files: string[];
  expected_state_keys: string[];
  expected_checks: string[];
  expected_execution_surfaces: string[];
  safety_boundaries: string[];
  completion_record_fields: Record<string, StateValue>;
  created_by: string;
  created_at: string;
  updated_at: string;
  supersedes_handoff_id: string | null;
};

export type HandoffInput = {
  handoff_id?: string;
  scope?: string | null;
  work_id?: string | null;
  source_state_brief_ref?: string | null;
  source_work_brief_ref?: string | null;
  target_agent: string;
  status?: HandoffStatus;
  current_committed_state_summary: string;
  task_brief: string;
  expected_files?: string[];
  expected_state_keys?: string[];
  expected_checks?: string[];
  expected_execution_surfaces?: string[];
  safety_boundaries?: string[];
  completion_record_fields?: Record<string, StateValue>;
  created_by: string;
  created_at?: string;
  supersedes_handoff_id?: string | null;
};

type HandoffRow = Omit<
  HandoffRecord,
  | "expected_files"
  | "expected_state_keys"
  | "expected_checks"
  | "expected_execution_surfaces"
  | "safety_boundaries"
  | "completion_record_fields"
> & {
  expected_files: string;
  expected_state_keys: string;
  expected_checks: string;
  expected_execution_surfaces: string;
  safety_boundaries: string;
  completion_record_fields: string;
};

export class HandoffNotFoundError extends Error {
  constructor(handoffId: string, scope: string | null) {
    super(
      scope
        ? `Unknown handoff_id ${handoffId} for scope ${scope}.`
        : `Unknown handoff_id ${handoffId}.`,
    );
    this.name = "HandoffNotFoundError";
  }
}

export function listHandoffs({
  scope,
  workId,
  status,
  limit = DEFAULT_HANDOFF_LIMIT,
}: {
  scope?: string | null;
  workId?: string | null;
  status?: HandoffStatus | null;
  limit?: number;
}) {
  const normalizedScope = normalizeScope(scope);
  const clauses = ["scope = ?"];
  const params: Array<string | number> = [normalizedScope];

  if (workId) {
    clauses.push("work_id = ?");
    params.push(normalizeWorkId(workId));
  }

  if (status) {
    assertHandoffStatus(status);
    clauses.push("status = ?");
    params.push(status);
  }

  params.push(normalizeLimit(limit));
  const db = openDatabase();

  try {
    const rows = db
      .prepare(
        `
          SELECT
            handoff_id,
            scope,
            work_id,
            source_state_brief_ref,
            source_work_brief_ref,
            target_agent,
            status,
            current_committed_state_summary,
            task_brief,
            expected_files,
            expected_state_keys,
            expected_checks,
            expected_execution_surfaces,
            safety_boundaries,
            completion_record_fields,
            created_by,
            created_at,
            updated_at,
            supersedes_handoff_id
          FROM handoffs
          WHERE ${clauses.join(" AND ")}
          ORDER BY created_at DESC, handoff_id ASC
          LIMIT ?
        `,
      )
      .all(...params) as HandoffRow[];

    return rows.map(parseHandoffRow);
  } finally {
    db.close();
  }
}

export function getHandoff(handoffId: string, scope?: string | null) {
  const normalizedScope = scope ? normalizeScope(scope) : null;
  const db = openDatabase();

  try {
    const row = db
      .prepare(
        `
          SELECT
            handoff_id,
            scope,
            work_id,
            source_state_brief_ref,
            source_work_brief_ref,
            target_agent,
            status,
            current_committed_state_summary,
            task_brief,
            expected_files,
            expected_state_keys,
            expected_checks,
            expected_execution_surfaces,
            safety_boundaries,
            completion_record_fields,
            created_by,
            created_at,
            updated_at,
            supersedes_handoff_id
          FROM handoffs
          WHERE handoff_id = ?
            ${normalizedScope ? "AND scope = ?" : ""}
        `,
      )
      .get(
        ...([handoffId.trim(), normalizedScope].filter(Boolean) as string[]),
      ) as HandoffRow | undefined;

    return row ? parseHandoffRow(row) : null;
  } finally {
    db.close();
  }
}

export function createHandoff(input: HandoffInput) {
  const now = input.created_at ?? new Date().toISOString();
  const row = {
    handoff_id:
      cleanNullableString(input.handoff_id) ?? `handoff:${randomUUID()}`,
    scope: normalizeScope(input.scope),
    work_id: input.work_id ? normalizeWorkId(input.work_id) : null,
    source_state_brief_ref: cleanNullableString(input.source_state_brief_ref),
    source_work_brief_ref: cleanNullableString(input.source_work_brief_ref),
    target_agent: requireNonEmptyString(input.target_agent, "target_agent"),
    status: input.status ?? "draft",
    current_committed_state_summary: requireNonEmptyString(
      input.current_committed_state_summary,
      "current_committed_state_summary",
    ),
    task_brief: requireNonEmptyString(input.task_brief, "task_brief"),
    expected_files: stringifyStringArray(input.expected_files ?? []),
    expected_state_keys: stringifyStringArray(input.expected_state_keys ?? []),
    expected_checks: stringifyStringArray(input.expected_checks ?? []),
    expected_execution_surfaces: stringifyStringArray(
      input.expected_execution_surfaces ?? [],
    ),
    safety_boundaries: stringifyStringArray(input.safety_boundaries ?? []),
    completion_record_fields: stringifyObject(
      input.completion_record_fields ?? {},
    ),
    created_by: requireNonEmptyString(input.created_by, "created_by"),
    created_at: now,
    updated_at: now,
    supersedes_handoff_id: cleanNullableString(input.supersedes_handoff_id),
  };
  assertHandoffStatus(row.status);
  const db = openDatabase();
  let handoff: HandoffRecord;

  try {
    handoff = db.transaction(() => {
      db.prepare(
        `
          INSERT INTO handoffs (
            handoff_id,
            scope,
            work_id,
            source_state_brief_ref,
            source_work_brief_ref,
            target_agent,
            status,
            current_committed_state_summary,
            task_brief,
            expected_files,
            expected_state_keys,
            expected_checks,
            expected_execution_surfaces,
            safety_boundaries,
            completion_record_fields,
            created_by,
            created_at,
            updated_at,
            supersedes_handoff_id
          )
          VALUES (
            @handoff_id,
            @scope,
            @work_id,
            @source_state_brief_ref,
            @source_work_brief_ref,
            @target_agent,
            @status,
            @current_committed_state_summary,
            @task_brief,
            @expected_files,
            @expected_state_keys,
            @expected_checks,
            @expected_execution_surfaces,
            @safety_boundaries,
            @completion_record_fields,
            @created_by,
            @created_at,
            @updated_at,
            @supersedes_handoff_id
          )
        `,
      ).run(row);

      return selectHandoffById(db, row.handoff_id);
    })();
  } finally {
    db.close();
  }

  appendHandoffEvent(handoff, "handoff_created", handoff.created_at);
  if (handoff.status === "ready") {
    appendHandoffEvent(handoff, "handoff_ready", handoff.created_at);
  }

  return handoff;
}

export function updateHandoffStatus({
  handoffId,
  scope,
  status,
}: {
  handoffId: string;
  scope?: string | null;
  status: HandoffStatus;
}) {
  assertHandoffStatus(status);
  const normalizedScope = scope ? normalizeScope(scope) : null;
  const now = new Date().toISOString();
  const db = openDatabase();
  let handoff: HandoffRecord;

  try {
    handoff = db.transaction(() => {
      selectHandoffById(db, handoffId.trim(), normalizedScope);

      db.prepare(
        `
          UPDATE handoffs
          SET status = ?, updated_at = ?
          WHERE handoff_id = ?
            ${normalizedScope ? "AND scope = ?" : ""}
        `,
      ).run(
        ...([status, now, handoffId.trim(), normalizedScope].filter(
          Boolean,
        ) as string[]),
      );

      return selectHandoffById(db, handoffId.trim(), normalizedScope);
    })();
  } finally {
    db.close();
  }

  if (status === "ready") {
    appendHandoffEvent(handoff, "handoff_ready", now);
  }

  return handoff;
}

function appendHandoffEvent(
  handoff: HandoffRecord,
  eventType: "handoff_created" | "handoff_ready",
  createdAt: string,
) {
  return appendCoordinationEvent({
    event_id: `event:${handoff.handoff_id}:${
      eventType === "handoff_created" ? "created" : "ready"
    }`,
    event_type: eventType,
    scope: handoff.scope,
    work_id: handoff.work_id,
    actor: handoff.created_by,
    target: handoff.target_agent,
    source_surface: "local_runtime",
    authority_level: "handoff_guidance",
    state_keys: handoff.expected_state_keys,
    payload_ref: handoff.handoff_id,
    result_status: handoff.status,
    created_at: createdAt,
  });
}

function selectHandoffById(
  db: ReturnType<typeof openDatabase>,
  handoffId: string,
  scope?: string | null,
) {
  const row = db
    .prepare(
      `
        SELECT
          handoff_id,
          scope,
          work_id,
          source_state_brief_ref,
          source_work_brief_ref,
          target_agent,
          status,
          current_committed_state_summary,
          task_brief,
          expected_files,
          expected_state_keys,
          expected_checks,
          expected_execution_surfaces,
          safety_boundaries,
          completion_record_fields,
          created_by,
          created_at,
          updated_at,
          supersedes_handoff_id
        FROM handoffs
        WHERE handoff_id = ?
          ${scope ? "AND scope = ?" : ""}
      `,
    )
    .get(...([handoffId, scope].filter(Boolean) as string[])) as
    | HandoffRow
    | undefined;

  if (!row) {
    throw new HandoffNotFoundError(handoffId, scope ?? null);
  }

  return parseHandoffRow(row);
}

function parseHandoffRow(row: HandoffRow): HandoffRecord {
  return {
    ...row,
    expected_files: parseStringArray(row.expected_files),
    expected_state_keys: parseStringArray(row.expected_state_keys),
    expected_checks: parseStringArray(row.expected_checks),
    expected_execution_surfaces: parseStringArray(
      row.expected_execution_surfaces,
    ),
    safety_boundaries: parseStringArray(row.safety_boundaries),
    completion_record_fields: parseObject(row.completion_record_fields),
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

function parseObject(value: string | null): Record<string, StateValue> {
  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, StateValue>)
      : {};
  } catch {
    return {};
  }
}

function stringifyStringArray(value: string[]) {
  return JSON.stringify(
    uniqueStrings(value.map((item) => item.trim()).filter(Boolean)),
  );
}

function stringifyObject(value: Record<string, StateValue>) {
  return JSON.stringify(value);
}

function uniqueStrings(values: string[]) {
  return [...new Set(values)];
}

function normalizeLimit(limit: number) {
  if (!Number.isFinite(limit)) {
    return DEFAULT_HANDOFF_LIMIT;
  }

  return Math.min(MAX_HANDOFF_LIMIT, Math.max(1, Math.floor(limit)));
}

function assertHandoffStatus(value: string): asserts value is HandoffStatus {
  if (!HANDOFF_STATUSES.includes(value as HandoffStatus)) {
    throw new Error(`status must be one of: ${HANDOFF_STATUSES.join(", ")}.`);
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
