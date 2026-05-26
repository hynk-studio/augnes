import { listActionRecords, openDatabase, type ActionRecord } from "@/lib/db";
import {
  listEvidenceRecords,
  type EvidenceRecord,
} from "@/lib/evidence-records";
import {
  getWorkItem,
  listWorkEvents,
  normalizeScope,
  normalizeWorkId,
  type WorkEvent,
  type WorkItem,
} from "@/lib/work";

const DEFAULT_SCOPE = "project:augnes";
const DEFAULT_SESSION_LIMIT = 50;
const MAX_SESSION_LIMIT = 100;
const RECENT_WORK_EVENT_LIMIT = 12;
const EVIDENCE_LIMIT = 100;

export const SESSION_SURFACES = [
  "chatgpt",
  "codex",
  "cockpit",
  "browser",
  "github",
  "local_runtime",
  "other",
] as const;

export type SessionSurface = (typeof SESSION_SURFACES)[number];

export type BindSessionInput = {
  session_id: string;
  scope?: string | null;
  surface: string;
  actor?: string | null;
  related_work_id?: string | null;
  related_pr?: string | null;
  summary?: string | null;
  handoff_ref?: string | null;
  evidence_pack_ref?: string | null;
};

export type SessionTraceFilters = {
  scope?: string | null;
  session_id?: string | null;
  limit?: number | null;
};

export type SessionRefFilters = {
  scope?: string | null;
  work_id?: string | null;
  related_pr?: string | null;
  limit?: number | null;
};

export type SessionRef = {
  session_id: string;
  surface: SessionSurface | null;
  actor: string | null;
  related_work_id: string | null;
  related_pr: string | null;
  summary: string | null;
  handoff_ref: string | null;
  evidence_pack_ref: string | null;
  started_at: string;
  ended_at: string | null;
};

export type SessionTrace = {
  runtime: "augnes";
  scope: string;
  generated_at: string;
  sessions: SessionTraceItem[];
  gaps: string[];
  boundaries: string[];
};

export type SessionTraceItem = {
  session_id: string;
  surface: SessionSurface | null;
  actor: string | null;
  title: string;
  summary: string | null;
  related_work_id: string | null;
  related_pr: string | null;
  handoff_ref: string | null;
  evidence_pack_ref: string | null;
  started_at: string;
  ended_at: string | null;
  evidence_counts: {
    messages: number;
    action_records_by_session: number;
    verification_evidence_records_for_work: number;
    verification_evidence_records_for_pr: number;
    verification_evidence_records_total: number;
  };
  work_event_counts: {
    total: number;
    by_event_type: Record<string, number>;
    with_related_action_id: number;
    with_related_pr: number;
  };
  proof_visibility: {
    session_owned_action_ids: string[];
    work_linked_proof_action_ids: string[];
    latest_work_event_related_action_id: string | null;
    source_session_id_note: string;
    binding_note: string;
  };
  latest_work_event: WorkEvent | null;
  latest_evidence_record: EvidenceRecord | null;
  message_count: number;
  latest_message: SessionMessageSummary | null;
  action_records: ActionRecordSummary[];
  work_linked_proof_actions: WorkLinkedProofActionSummary[];
  work: WorkItem | null;
  gaps: string[];
};

type SessionRow = {
  id: string;
  agent_id: string | null;
  scope: string;
  title: string;
  started_at: string;
  ended_at: string | null;
  surface: SessionSurface | null;
  actor: string | null;
  related_work_id: string | null;
  related_pr: string | null;
  summary: string | null;
  handoff_ref: string | null;
  evidence_pack_ref: string | null;
};

type SessionMessageSummary = {
  id: string;
  role: string;
  created_at: string;
};

type ActionRecordSummary = {
  id: string;
  title: string;
  state_key: string | null;
  status: string;
  source_session_id: string | null;
  proof_marker_type: ProofMarkerType;
  created_at: string;
  completed_at: string | null;
};

type ProofMarkerType = "proof_only" | "committed_state_marker";

type WorkLinkedProofActionSummary = {
  id: string;
  title: string;
  state_key: string | null;
  status: string;
  source_session_id: string | null;
  proof_marker_type: ProofMarkerType;
  linked_work_event_ids: string[];
  created_at: string;
  completed_at: string | null;
};

export class SessionBindingValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SessionBindingValidationError";
  }
}

export class SessionNotFoundError extends Error {
  constructor(sessionId: string, scope: string) {
    super(`Unknown session_id ${sessionId} for scope ${scope}.`);
    this.name = "SessionNotFoundError";
  }
}

export function bindSession(input: BindSessionInput) {
  const normalized = normalizeBindInput(input);
  const db = openDatabase();

  try {
    const existing = selectSessionRow(db, normalized.session_id);
    if (!existing || existing.scope !== normalized.scope) {
      throw new SessionNotFoundError(normalized.session_id, normalized.scope);
    }

    db.prepare(
      `
        UPDATE sessions
        SET
          surface = @surface,
          actor = @actor,
          related_work_id = @related_work_id,
          related_pr = @related_pr,
          summary = @summary,
          handoff_ref = @handoff_ref,
          evidence_pack_ref = @evidence_pack_ref
        WHERE id = @session_id
          AND scope = @scope
      `,
    ).run(normalized);

    const row = selectSessionRow(db, normalized.session_id);
    if (!row) {
      throw new SessionNotFoundError(normalized.session_id, normalized.scope);
    }

    return parseBoundSession(row);
  } finally {
    db.close();
  }
}

export function buildSessionTrace(filters: SessionTraceFilters = {}): SessionTrace {
  const scope = normalizeScope(filters.scope ?? DEFAULT_SCOPE);
  const sessionId = cleanNullableString(filters.session_id);
  const limit = normalizeLimit(filters.limit);
  const db = openDatabase();

  try {
    const rows = selectSessionRows(db, { scope, sessionId, limit });
    const sessions = rows.map((row) => buildSessionTraceItem(row));
    const gaps = collectTraceGaps({ sessionId, sessions });

    return {
      runtime: "augnes",
      scope,
      generated_at: new Date().toISOString(),
      sessions,
      gaps,
      boundaries: [
        "Session trace is a bounded read-only view over existing Augnes Core records.",
        "POST /api/sessions/bind only updates session metadata fields.",
        "Completion proof recording does not create or bind sessions and does not set source_session_id automatically.",
        "action_records_by_session counts only action_records whose source_session_id matches the session.",
        "Work-linked proof actions are derived from bound work_events.related_action_id and remain separate from session-owned action records.",
        "Session trace does not execute Codex, call OpenAI/GitHub, publish, approve, retry, or mutate work/evidence/publication/delivery/readiness/mailbox/state records.",
        "evidence_pack_ref is included as a string reference; the trace API does not invoke Evidence Pack generation.",
      ],
    };
  } finally {
    db.close();
  }
}

export function listSessionRefs(filters: SessionRefFilters): SessionRef[] {
  const scope = normalizeScope(filters.scope ?? DEFAULT_SCOPE);
  const workId = normalizeNullableWorkId(filters.work_id);
  const relatedPr = cleanNullableString(filters.related_pr);
  const limit = normalizeLimit(filters.limit);

  if (!workId && !relatedPr) {
    return [];
  }

  const clauses = ["scope = ?"];
  const params: Array<string | number> = [scope];
  const relationClauses: string[] = [];
  if (workId) {
    relationClauses.push("related_work_id = ?");
    params.push(workId);
  }
  if (relatedPr) {
    relationClauses.push("related_pr = ?");
    params.push(relatedPr);
  }
  clauses.push(`(${relationClauses.join(" OR ")})`);
  params.push(limit);

  const db = openDatabase();
  try {
    const rows = db
      .prepare(
        `
          SELECT
            id,
            agent_id,
            scope,
            title,
            started_at,
            ended_at,
            surface,
            actor,
            related_work_id,
            related_pr,
            summary,
            handoff_ref,
            evidence_pack_ref
          FROM sessions
          WHERE ${clauses.join(" AND ")}
          ORDER BY started_at DESC, id ASC
          LIMIT ?
        `,
      )
      .all(...params) as SessionRow[];

    return rows.map((row) => ({
      session_id: row.id,
      surface: row.surface,
      actor: row.actor,
      related_work_id: row.related_work_id,
      related_pr: row.related_pr,
      summary: row.summary,
      handoff_ref: row.handoff_ref,
      evidence_pack_ref: row.evidence_pack_ref,
      started_at: row.started_at,
      ended_at: row.ended_at,
    }));
  } finally {
    db.close();
  }
}

function buildSessionTraceItem(row: SessionRow): SessionTraceItem {
  const work = row.related_work_id
    ? getWorkItem(row.related_work_id, row.scope)
    : null;
  const workEvents = row.related_work_id
    ? listWorkEvents({
        workId: row.related_work_id,
        scope: row.scope,
        limit: RECENT_WORK_EVENT_LIMIT,
      })
    : [];
  const evidenceForWork = row.related_work_id
    ? listEvidenceRecords({
        scope: row.scope,
        work_id: row.related_work_id,
        limit: EVIDENCE_LIMIT,
      })
    : [];
  const evidenceForPr = row.related_pr
    ? listEvidenceRecords({
        scope: row.scope,
        target_ref: row.related_pr,
        limit: EVIDENCE_LIMIT,
      })
    : [];
  const evidenceRecords = uniqueEvidenceRecords([
    ...evidenceForWork,
    ...evidenceForPr,
  ]);
  const actionRecords = listActionRecordSummaries(row.scope, row.id);
  const workLinkedProofActions = listWorkLinkedProofActions({
    scope: row.scope,
    workEvents,
  });
  const messageSummary = getMessageSummary(row.id);
  const latestEvidenceRecord = evidenceRecords[0] ?? null;
  const gaps = collectSessionGaps({
    row,
    work,
    workEvents,
    evidenceRecords,
    messageCount: messageSummary.count,
  });

  return {
    session_id: row.id,
    surface: row.surface,
    actor: row.actor,
    title: row.title,
    summary: row.summary,
    related_work_id: row.related_work_id,
    related_pr: row.related_pr,
    handoff_ref: row.handoff_ref,
    evidence_pack_ref: row.evidence_pack_ref,
    started_at: row.started_at,
    ended_at: row.ended_at,
    evidence_counts: {
      messages: messageSummary.count,
      action_records_by_session: actionRecords.length,
      verification_evidence_records_for_work: evidenceForWork.length,
      verification_evidence_records_for_pr: evidenceForPr.length,
      verification_evidence_records_total: evidenceRecords.length,
    },
    work_event_counts: {
      total: workEvents.length,
      by_event_type: countBy(workEvents.map((event) => event.event_type)),
      with_related_action_id: workEvents.filter((event) => event.related_action_id).length,
      with_related_pr: workEvents.filter((event) => event.related_pr).length,
    },
    proof_visibility: {
      session_owned_action_ids: actionRecords.map((record) => record.id),
      work_linked_proof_action_ids: workLinkedProofActions.map((record) => record.id),
      latest_work_event_related_action_id: workEvents[0]?.related_action_id ?? null,
      source_session_id_note:
        "action_records_by_session counts only action_records whose source_session_id matches this session.",
      binding_note:
        "Proof-only closeout remains visible through bound work_events.related_action_id after explicit session binding; completion proof recording does not bind sessions.",
    },
    latest_work_event: workEvents[0] ?? null,
    latest_evidence_record: latestEvidenceRecord,
    message_count: messageSummary.count,
    latest_message: messageSummary.latest,
    action_records: actionRecords,
    work_linked_proof_actions: workLinkedProofActions,
    work,
    gaps,
  };
}

function normalizeBindInput(input: BindSessionInput) {
  const sessionId = requireNonEmptyString(input.session_id, "session_id");
  const surface = requireSessionSurface(input.surface);

  return {
    session_id: sessionId,
    scope: normalizeScope(input.scope ?? DEFAULT_SCOPE),
    surface,
    actor: cleanNullableString(input.actor),
    related_work_id: normalizeNullableWorkId(input.related_work_id),
    related_pr: cleanNullableString(input.related_pr),
    summary: cleanNullableString(input.summary),
    handoff_ref: cleanNullableString(input.handoff_ref),
    evidence_pack_ref: cleanNullableString(input.evidence_pack_ref),
  };
}

function parseBoundSession(row: SessionRow) {
  return {
    session_id: row.id,
    scope: row.scope,
    surface: row.surface,
    actor: row.actor,
    related_work_id: row.related_work_id,
    related_pr: row.related_pr,
    summary: row.summary,
    handoff_ref: row.handoff_ref,
    evidence_pack_ref: row.evidence_pack_ref,
    title: row.title,
    started_at: row.started_at,
    ended_at: row.ended_at,
  };
}

function selectSessionRow(
  db: ReturnType<typeof openDatabase>,
  sessionId: string,
): SessionRow | null {
  return (
    (db
      .prepare(
        `
          SELECT
            id,
            agent_id,
            scope,
            title,
            started_at,
            ended_at,
            surface,
            actor,
            related_work_id,
            related_pr,
            summary,
            handoff_ref,
            evidence_pack_ref
          FROM sessions
          WHERE id = ?
        `,
      )
      .get(sessionId) as SessionRow | undefined) ?? null
  );
}

function selectSessionRows(
  db: ReturnType<typeof openDatabase>,
  {
    scope,
    sessionId,
    limit,
  }: {
    scope: string;
    sessionId: string | null;
    limit: number;
  },
): SessionRow[] {
  if (sessionId) {
    return db
      .prepare(
        `
          SELECT
            id,
            agent_id,
            scope,
            title,
            started_at,
            ended_at,
            surface,
            actor,
            related_work_id,
            related_pr,
            summary,
            handoff_ref,
            evidence_pack_ref
          FROM sessions
          WHERE scope = ?
            AND id = ?
          LIMIT 1
        `,
      )
      .all(scope, sessionId) as SessionRow[];
  }

  return db
    .prepare(
      `
        SELECT
          id,
          agent_id,
          scope,
          title,
          started_at,
          ended_at,
          surface,
          actor,
          related_work_id,
          related_pr,
          summary,
          handoff_ref,
          evidence_pack_ref
        FROM sessions
        WHERE scope = ?
        ORDER BY started_at DESC, id ASC
        LIMIT ?
      `,
    )
    .all(scope, limit) as SessionRow[];
}

function listActionRecordSummaries(
  scope: string,
  sessionId: string,
): ActionRecordSummary[] {
  const db = openDatabase();

  try {
    const rows = db
      .prepare(
        `
          SELECT
            scope,
            id,
            title,
            description,
            state_key,
            status,
            source_agent_id,
            source_session_id,
            created_at,
            completed_at
          FROM action_records
          WHERE scope = ?
            AND source_session_id = ?
          ORDER BY created_at DESC, id ASC
          LIMIT 25
        `,
      )
      .all(scope, sessionId) as ActionRecord[];

    return rows.map(formatActionRecordSummary);
  } finally {
    db.close();
  }
}

function listWorkLinkedProofActions({
  scope,
  workEvents,
}: {
  scope: string;
  workEvents: WorkEvent[];
}): WorkLinkedProofActionSummary[] {
  const linkedEventIdsByActionId = workEvents.reduce<Record<string, string[]>>(
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
  const linkedActionIds = new Set(Object.keys(linkedEventIdsByActionId));
  if (linkedActionIds.size === 0) {
    return [];
  }

  return listActionRecords(scope)
    .filter((record) => linkedActionIds.has(record.id))
    .map((record) => ({
      ...formatActionRecordSummary(record),
      linked_work_event_ids: linkedEventIdsByActionId[record.id] ?? [],
    }));
}

function formatActionRecordSummary(record: ActionRecord): ActionRecordSummary {
  return {
    id: record.id,
    title: record.title,
    state_key: record.state_key,
    status: record.status,
    source_session_id: record.source_session_id,
    proof_marker_type: record.state_key ? "committed_state_marker" : "proof_only",
    created_at: record.created_at,
    completed_at: record.completed_at,
  };
}

function getMessageSummary(sessionId: string): {
  count: number;
  latest: SessionMessageSummary | null;
} {
  const db = openDatabase();

  try {
    const countRow = db
      .prepare(
        `
          SELECT COUNT(*) AS count
          FROM messages
          WHERE session_id = ?
        `,
      )
      .get(sessionId) as { count: number };
    const latest =
      (db
        .prepare(
          `
            SELECT id, role, created_at
            FROM messages
            WHERE session_id = ?
            ORDER BY created_at DESC, id ASC
            LIMIT 1
          `,
        )
        .get(sessionId) as SessionMessageSummary | undefined) ?? null;

    return { count: countRow.count, latest };
  } finally {
    db.close();
  }
}

function collectTraceGaps({
  sessionId,
  sessions,
}: {
  sessionId: string | null;
  sessions: SessionTraceItem[];
}) {
  const gaps: string[] = [];
  if (sessionId && sessions.length === 0) {
    gaps.push(`unknown_session:${sessionId}`);
  }
  if (!sessionId && sessions.length === 0) {
    gaps.push("no_sessions_for_scope");
  }
  if (sessions.some((session) => session.gaps.includes("unbound_session"))) {
    gaps.push("one_or_more_sessions_unbound");
  }

  return gaps;
}

function collectSessionGaps({
  row,
  work,
  workEvents,
  evidenceRecords,
  messageCount,
}: {
  row: SessionRow;
  work: WorkItem | null;
  workEvents: WorkEvent[];
  evidenceRecords: EvidenceRecord[];
  messageCount: number;
}) {
  const gaps: string[] = [];
  if (!row.surface) gaps.push("unbound_session");
  if (!row.related_work_id) gaps.push("missing_related_work_id");
  if (row.related_work_id && !work) gaps.push("unknown_related_work_id");
  if (row.related_work_id && workEvents.length === 0) gaps.push("no_work_events_for_related_work");
  if (evidenceRecords.length === 0) gaps.push("no_verification_evidence_records_linked");
  if (messageCount === 0) gaps.push("no_messages_for_session");

  return gaps;
}

function uniqueEvidenceRecords(records: EvidenceRecord[]) {
  const seen = new Set<string>();
  const unique: EvidenceRecord[] = [];
  for (const record of records) {
    if (seen.has(record.evidence_id)) continue;
    seen.add(record.evidence_id);
    unique.push(record);
  }

  return unique.sort((a, b) =>
    b.created_at.localeCompare(a.created_at) || a.evidence_id.localeCompare(b.evidence_id),
  );
}

function countBy(values: string[]) {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function requireNonEmptyString(value: unknown, key: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new SessionBindingValidationError(`${key} is required.`);
  }

  return value.trim();
}

function cleanNullableString(value: unknown) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new SessionBindingValidationError("Optional fields must be strings when provided.");
  }

  return value.trim() || null;
}

function normalizeNullableWorkId(value: unknown) {
  const clean = cleanNullableString(value);
  return clean ? normalizeWorkId(clean) : null;
}

function requireSessionSurface(value: unknown): SessionSurface {
  const surface = requireNonEmptyString(value, "surface");
  if (!SESSION_SURFACES.includes(surface as SessionSurface)) {
    throw new SessionBindingValidationError(
      `surface must be one of: ${SESSION_SURFACES.join(", ")}.`,
    );
  }

  return surface as SessionSurface;
}

function normalizeLimit(value: number | null | undefined) {
  if (!Number.isFinite(value ?? NaN)) {
    return DEFAULT_SESSION_LIMIT;
  }

  return Math.min(MAX_SESSION_LIMIT, Math.max(1, Math.floor(value as number)));
}
