import { randomUUID } from "node:crypto";
import {
  appendCoordinationEvent,
  listCoordinationEvents,
  type CoordinationEvent,
} from "@/lib/coordination-events";
import { listActionRecords, openDatabase, type ActionRecord } from "@/lib/db";

const DEFAULT_SCOPE = "project:augnes";
const DEFAULT_EVENT_LIMIT = 12;

export const WORK_STATUSES = [
  "planned",
  "in_progress",
  "blocked",
  "needs_review",
  "completed",
  "archived",
] as const;

export const WORK_PRIORITIES = [
  "now",
  "next",
  "later",
  "high",
  "normal",
  "low",
] as const;

export const WORK_ACTORS = [
  "user",
  "chatgpt",
  "codex",
  "augnes_runtime",
] as const;

export const WORK_EVENT_TYPES = [
  "note",
  "implementation",
  "verification",
  "review",
  "handoff",
  "blocked",
  "decision",
] as const;

export type WorkStatus = (typeof WORK_STATUSES)[number];
export type WorkPriority = (typeof WORK_PRIORITIES)[number];
export type WorkActor = (typeof WORK_ACTORS)[number];
export type WorkEventType = (typeof WORK_EVENT_TYPES)[number];

export type WorkLinks = Record<string, unknown>;

export type WorkItem = {
  work_id: string;
  scope: string;
  title: string;
  status: WorkStatus | string;
  priority: WorkPriority | string;
  summary: string;
  next_action: string;
  user_attention_required: boolean;
  related_state_keys: string[];
  links: WorkLinks;
  created_at: string;
  updated_at: string;
};

export type CanonicalWorkItemResolution =
  | {
      status: "resolved";
      canonical_work_id: string;
      work: WorkItem;
    }
  | {
      status: "missing" | "ambiguous" | "noncanonical";
      canonical_work_id: string;
      work: null;
    };

export type WorkEvent = {
  id: string;
  work_id: string;
  scope: string;
  actor: WorkActor | string;
  event_type: WorkEventType | string;
  summary: string;
  result_status: string | null;
  result_kind: string | null;
  related_action_id: string | null;
  related_pr: string | null;
  related_state_keys: string[];
  created_at: string;
};

export type WorkEventInput = {
  work_id: string;
  scope?: string;
  actor?: WorkActor;
  event_type?: WorkEventType;
  summary: string;
  result_status?: string | null;
  result_kind?: string | null;
  related_action_id?: string | null;
  related_pr?: string | null;
  related_state_keys?: string[];
  created_at?: string;
};

export type ProofMarkerType = "proof_only" | "committed_state_marker";

export type WorkProofActionRecord = {
  id: string;
  title: string;
  status: string;
  state_key: string | null;
  proof_marker_type: ProofMarkerType;
  linked_work_event_ids: string[];
  created_at: string;
};

export type WorkBrief = {
  runtime: "augnes";
  scope: string;
  work_id: string;
  as_of: string;
  framing: {
    work_id: string;
    state_authority: string;
    execution_proof: string;
    temporal_proof: string;
  };
  work: WorkItem;
  next_action: string;
  user_attention_required: boolean;
  recent_events: WorkEvent[];
  coordination_events: CoordinationEvent[];
  related_state_keys: string[];
  related_proof: {
    action_ids: string[];
    action_records: WorkProofActionRecord[];
    prs: string[];
    docs: string[];
    links: WorkLinks;
    note: string;
  };
  codex_handoff: {
    task_brief: string;
    constraints: string[];
    suggested_verification: string[];
    work_event_template: WorkEventInput;
  };
};

type WorkItemRow = Omit<
  WorkItem,
  "user_attention_required" | "related_state_keys" | "links"
> & {
  user_attention_required: number;
  related_state_keys: string;
  links: string;
};

type WorkEventRow = Omit<WorkEvent, "related_state_keys"> & {
  related_state_keys: string;
};

export function normalizeWorkId(workId: string) {
  return workId.trim().toUpperCase();
}

export function normalizeScope(scope?: string | null) {
  return scope?.trim() || DEFAULT_SCOPE;
}

export function listWorkItems(scope = DEFAULT_SCOPE): WorkItem[] {
  const db = openDatabase();

  try {
    return listWorkItemsFromDatabase(db, scope);
  } finally {
    db.close();
  }
}

export function listWorkItemsFromDatabase(
  db: ReturnType<typeof openDatabase>,
  scope: string,
): WorkItem[] {
  const rows = db
    .prepare(
      `
        SELECT
          work_id,
          scope,
          title,
          status,
          priority,
          summary,
          next_action,
          user_attention_required,
          related_state_keys,
          links,
          created_at,
          updated_at
        FROM work_items
        WHERE scope = ?
        ORDER BY
          CASE priority
            WHEN 'now' THEN 0
            WHEN 'high' THEN 1
            WHEN 'next' THEN 2
            WHEN 'normal' THEN 3
            WHEN 'later' THEN 4
            WHEN 'low' THEN 5
            ELSE 6
          END,
          updated_at DESC,
          work_id ASC
      `,
    )
    .all(scope) as WorkItemRow[];

  return rows.map(parseWorkItemRow);
}

export function getWorkItem(workId: string, scope = DEFAULT_SCOPE) {
  const db = openDatabase();

  try {
    const row = selectWorkItemRow(db, normalizeWorkId(workId), scope);

    return row ? parseWorkItemRow(row) : null;
  } finally {
    db.close();
  }
}

export function resolveCanonicalWorkItemFromDatabase(
  db: ReturnType<typeof openDatabase>,
  workId: string,
  scope: string,
): CanonicalWorkItemResolution {
  const canonicalWorkId = normalizeWorkId(workId);
  const canonicalScope = normalizeScope(scope);
  const rows = db
    .prepare(
      `
        SELECT
          work_id,
          scope,
          title,
          status,
          priority,
          summary,
          next_action,
          user_attention_required,
          related_state_keys,
          links,
          created_at,
          updated_at
        FROM work_items
        WHERE scope = ? AND UPPER(TRIM(work_id)) = ?
        ORDER BY work_id ASC
        LIMIT 2
      `,
    )
    .all(canonicalScope, canonicalWorkId) as WorkItemRow[];

  if (rows.length === 0) {
    return {
      status: "missing",
      canonical_work_id: canonicalWorkId,
      work: null,
    };
  }
  if (rows.length > 1) {
    return {
      status: "ambiguous",
      canonical_work_id: canonicalWorkId,
      work: null,
    };
  }
  const row = rows[0]!;
  if (row.work_id !== canonicalWorkId || row.scope !== canonicalScope) {
    return {
      status: "noncanonical",
      canonical_work_id: canonicalWorkId,
      work: null,
    };
  }
  return {
    status: "resolved",
    canonical_work_id: canonicalWorkId,
    work: parseWorkItemRow(row),
  };
}

export function listWorkEvents({
  workId,
  scope = DEFAULT_SCOPE,
  limit = DEFAULT_EVENT_LIMIT,
}: {
  workId: string;
  scope?: string;
  limit?: number;
}) {
  const db = openDatabase();

  try {
    const rows = db
      .prepare(
        `
          SELECT
            id,
            work_id,
            scope,
            actor,
            event_type,
            summary,
            result_status,
            result_kind,
            related_action_id,
            related_pr,
            related_state_keys,
            created_at
          FROM work_events
          WHERE scope = ? AND work_id = ?
          ORDER BY created_at DESC, id ASC
          LIMIT ?
        `,
      )
      .all(scope, normalizeWorkId(workId), Math.max(1, limit)) as WorkEventRow[];

    return rows.map(parseWorkEventRow);
  } finally {
    db.close();
  }
}

export function appendWorkEvent(input: WorkEventInput) {
  const scope = normalizeScope(input.scope);
  const workId = normalizeWorkId(input.work_id);
  const db = openDatabase();
  const now = input.created_at ?? new Date().toISOString();
  let event: WorkEvent;

  try {
    event = db.transaction(() => {
      const workItem = selectWorkItemRow(db, workId, scope);
      if (!workItem) {
        throw new WorkNotFoundError(workId, scope);
      }

      const row = {
        id: `work-event:${randomUUID()}`,
        work_id: workId,
        scope,
        actor: input.actor ?? "codex",
        event_type: input.event_type ?? "note",
        summary: input.summary.trim(),
        result_status: cleanNullableString(input.result_status),
        result_kind: cleanNullableString(input.result_kind),
        related_action_id: cleanNullableString(input.related_action_id),
        related_pr: cleanNullableString(input.related_pr),
        related_state_keys: stringifyStringArray(input.related_state_keys ?? []),
        created_at: now,
      };

      db.prepare(
        `
          INSERT INTO work_events (
            id,
            work_id,
            scope,
            actor,
            event_type,
            summary,
            result_status,
            result_kind,
            related_action_id,
            related_pr,
            related_state_keys,
            created_at
          )
          VALUES (
            @id,
            @work_id,
            @scope,
            @actor,
            @event_type,
            @summary,
            @result_status,
            @result_kind,
            @related_action_id,
            @related_pr,
            @related_state_keys,
            @created_at
          )
        `,
      ).run(row);

      db.prepare(
        `
          UPDATE work_items
          SET updated_at = ?
          WHERE scope = ? AND work_id = ?
        `,
      ).run(now, scope, workId);

      const inserted = db
        .prepare(
          `
            SELECT
              id,
              work_id,
              scope,
              actor,
              event_type,
              summary,
              result_status,
              result_kind,
              related_action_id,
              related_pr,
              related_state_keys,
              created_at
            FROM work_events
            WHERE id = ?
          `,
        )
        .get(row.id) as WorkEventRow;

      return parseWorkEventRow(inserted);
    })();
  } finally {
    db.close();
  }

  appendCoordinationEvent({
    event_id: `event:${event.id}`,
    event_type: "work_event_recorded",
    scope: event.scope,
    work_id: event.work_id,
    actor: event.actor,
    source_surface: "local_runtime",
    authority_level: "execution_trace",
    state_keys: event.related_state_keys,
    payload_ref: event.id,
    result_status: event.result_status,
    created_at: event.created_at,
  });

  return event;
}

export function buildWorkBrief(workId: string, scope = DEFAULT_SCOPE): WorkBrief | null {
  const work = getWorkItem(workId, scope);
  if (!work) {
    return null;
  }

  const recentEvents = listWorkEvents({ workId: work.work_id, scope, limit: 12 });
  const coordinationEvents = listCoordinationEvents({
    workId: work.work_id,
    scope,
    limit: 12,
  });
  const relatedStateKeys = uniqueStrings([
    ...work.related_state_keys,
    ...recentEvents.flatMap((event) => event.related_state_keys),
  ]);
  const actionIds = uniqueStrings(
    recentEvents
      .map((event) => event.related_action_id)
      .filter((value): value is string => Boolean(value)),
  );
  const actionRecords = buildRelatedActionRecordProof({
    scope,
    recentEvents,
    actionIds,
  });
  const prs = uniqueStrings([
    ...extractStringArray(work.links.prs),
    ...extractStringArray(work.links.github_prs),
    ...recentEvents
      .map((event) => event.related_pr)
      .filter((value): value is string => Boolean(value)),
  ]);
  const docs = uniqueStrings([
    ...extractStringArray(work.links.docs),
    ...extractStringArray(work.links.documents),
  ]);

  return {
    runtime: "augnes",
    scope,
    work_id: work.work_id,
    as_of: new Date().toISOString(),
    framing: {
      work_id: "Trace anchor only; not canonical project state.",
      state_authority: "Durable state authority remains Augnes committed state.",
      execution_proof:
        "Official execution proof remains action_records; work_events only link and summarize.",
      temporal_proof: "Temporal State Graph remains proof over time.",
    },
    work,
    next_action: work.next_action,
    user_attention_required: work.user_attention_required,
    recent_events: recentEvents,
    coordination_events: coordinationEvents,
    related_state_keys: relatedStateKeys,
    related_proof: {
      action_ids: actionIds,
      action_records: actionRecords,
      prs,
      docs,
      links: work.links,
      note:
        "Action records with state_key: null are proof-only records; linked work_events make them visible without committed state mutation.",
    },
    codex_handoff: {
      task_brief: [
        `${work.work_id}: ${work.title}.`,
        work.summary,
        work.next_action ? `Next action: ${work.next_action}` : "",
      ]
        .filter(Boolean)
        .join(" "),
      constraints: [
        "Treat work_id as a trace anchor, not a second source of truth.",
        "Use committed Augnes state for durable project facts.",
        "Use action_records and the Temporal State Graph as official execution proof.",
        "Record work_events only as human-readable trace notes linked to proof when relevant.",
        "For boundary-relevant PR review findings, use PR comments or review comments as repo-anchored review anchors per docs/PR_REVIEW_ANCHOR_CONVENTION_V0_1.md.",
        "Treat review anchors as review aids only, not source of truth, proof, evidence status, readiness, score, benchmark, runtime authority, or implementation approval; record missing exact external ChatGPT/Codex prompt or review text as a gap rather than reconstructing it.",
      ],
      suggested_verification: [
        `curl -sS "http://localhost:3000/api/work/${work.work_id}?scope=${encodeURIComponent(scope)}" | jq .`,
        `curl -sS "http://localhost:3000/api/work/${work.work_id}/brief?scope=${encodeURIComponent(scope)}" | jq .`,
      ],
      work_event_template: {
        work_id: work.work_id,
        scope,
        actor: "codex",
        event_type: "implementation",
        summary: "Summarize the human-readable work result.",
        related_action_id: null,
        related_pr: null,
        related_state_keys: relatedStateKeys,
      },
    },
  };
}

function buildRelatedActionRecordProof({
  scope,
  recentEvents,
  actionIds,
}: {
  scope: string;
  recentEvents: WorkEvent[];
  actionIds: string[];
}): WorkProofActionRecord[] {
  if (actionIds.length === 0) {
    return [];
  }

  const linkedEventIdsByActionId = recentEvents.reduce<Record<string, string[]>>(
    (links, event) => {
      if (!event.related_action_id) {
        return links;
      }

      links[event.related_action_id] = [
        ...(links[event.related_action_id] ?? []),
        event.id,
      ];
      return links;
    },
    {},
  );
  const actionIdSet = new Set(actionIds);

  return listActionRecords(scope)
    .filter((record) => actionIdSet.has(record.id))
    .map((record) => formatWorkProofActionRecord(record, linkedEventIdsByActionId));
}

function formatWorkProofActionRecord(
  record: ActionRecord,
  linkedEventIdsByActionId: Record<string, string[]>,
): WorkProofActionRecord {
  return {
    id: record.id,
    title: record.title,
    status: record.status,
    state_key: record.state_key,
    proof_marker_type: record.state_key ? "committed_state_marker" : "proof_only",
    linked_work_event_ids: linkedEventIdsByActionId[record.id] ?? [],
    created_at: record.created_at,
  };
}

export class WorkNotFoundError extends Error {
  constructor(workId: string, scope: string) {
    super(`Unknown work_id ${workId} for scope ${scope}.`);
    this.name = "WorkNotFoundError";
  }
}

function selectWorkItemRow(
  db: ReturnType<typeof openDatabase>,
  workId: string,
  scope: string,
) {
  return db
    .prepare(
      `
        SELECT
          work_id,
          scope,
          title,
          status,
          priority,
          summary,
          next_action,
          user_attention_required,
          related_state_keys,
          links,
          created_at,
          updated_at
        FROM work_items
        WHERE scope = ? AND work_id = ?
      `,
    )
    .get(scope, workId) as WorkItemRow | undefined;
}

function parseWorkItemRow(row: WorkItemRow): WorkItem {
  return {
    ...row,
    user_attention_required: Boolean(row.user_attention_required),
    related_state_keys: parseStringArray(row.related_state_keys),
    links: parseObject(row.links),
  };
}

function parseWorkEventRow(row: WorkEventRow): WorkEvent {
  return {
    ...row,
    related_state_keys: parseStringArray(row.related_state_keys),
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

function parseObject(value: string | null): WorkLinks {
  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as WorkLinks)
      : {};
  } catch {
    return {};
  }
}

function stringifyStringArray(value: string[]) {
  return JSON.stringify(uniqueStrings(value.map((item) => item.trim()).filter(Boolean)));
}

function cleanNullableString(value: string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  return value.trim() || null;
}

function extractStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  if (typeof value === "string") {
    return [value];
  }

  return [];
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}
