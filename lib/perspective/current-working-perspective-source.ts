import Database from "better-sqlite3";

import {
  AUGNES_DELTA_PROJECTION_ROUTE_SCOPE,
  buildAugnesDeltaProjectionRuntimeReadModel,
} from "@/lib/augnes-delta/source-collector";
import { getDatabasePath } from "@/lib/db";
import {
  buildCurrentWorkingPerspective,
  createCurrentWorkingPerspectiveGap,
} from "@/lib/perspective/current-working-perspective";
import {
  READONLY_LOCAL_HOSTS,
  validateReadonlyApiLocalAccess,
  type ReadonlyApiAccessErrorCode,
  type ReadonlyApiAccessErrorStatus,
  type ReadonlyApiAccessPolicy,
} from "@/lib/readonly-api/access-guard";
import {
  shouldUseReadonlyApiLocalDevAuthStrictMode,
  validateReadonlyApiLocalDevAuthAdapter,
} from "@/lib/readonly-api/local-dev-auth-adapter";
import type {
  CurrentWorkingPerspective,
  CurrentWorkingPerspectiveGap,
  CurrentWorkingPerspectiveInput,
  CurrentWorkingPerspectiveSnapshotInput,
} from "@/types/current-working-perspective";
import type {
  ReadonlyApiAuthScopeErrorCodeV0,
  ReadonlyApiAuthScopeFailureV0,
} from "@/types/readonly-api-auth-scope";

export const CURRENT_WORKING_PERSPECTIVE_ROUTE_SCOPE =
  AUGNES_DELTA_PROJECTION_ROUTE_SCOPE;
export const CURRENT_WORKING_PERSPECTIVE_LOCAL_READ_HEADER =
  "x-augnes-local-readonly";
export const CURRENT_WORKING_PERSPECTIVE_LOCAL_READ_MARKER =
  "current-working-perspective-v0.1";
export const CURRENT_WORKING_PERSPECTIVE_ROUTE_FAMILY =
  "current_working_perspective";
export const CURRENT_WORKING_PERSPECTIVE_ROUTE_ID =
  "perspective.current.v0.1";
export const CURRENT_WORKING_PERSPECTIVE_CACHE_CONTROL = "no-store";
export const CURRENT_WORKING_PERSPECTIVE_ACCESS_POLICY: ReadonlyApiAccessPolicy = {
  route_id: CURRENT_WORKING_PERSPECTIVE_ROUTE_ID,
  required_scope: CURRENT_WORKING_PERSPECTIVE_ROUTE_SCOPE,
  required_marker_header: CURRENT_WORKING_PERSPECTIVE_LOCAL_READ_HEADER,
  required_marker_value: CURRENT_WORKING_PERSPECTIVE_LOCAL_READ_MARKER,
  allowed_hosts: READONLY_LOCAL_HOSTS,
  route_family: CURRENT_WORKING_PERSPECTIVE_ROUTE_FAMILY,
};

const PERSPECTIVE_VERSION = "current_working_perspective.v0.1" as const;
const PROJECTION_VERSION = "augnes_delta_projection.v0.1" as const;
const SNAPSHOT_VERSION = "perspective_snapshot.v0.1" as const;

const STATE_ENTRY_LIMIT = 16;
const PROPOSAL_LIMIT = 24;
const EVIDENCE_LIMIT = 12;
const WORK_LIMIT = 8;
const WORK_EVENT_LIMIT = 32;
const ACTION_LIMIT = 12;
const TENSION_LIMIT = 12;
const TEXT_LIMIT = 360;

const READ_ERROR_AUTHORITY_BOUNDARY = [
  "GET-only local read-only Current Working Perspective route",
  "fail-closed scope and local marker validation",
  "read-only existing DB open only",
  "PerspectiveSnapshot-shaped input is collected without migrations",
  "AugnesDeltaProjectionReadModel is collected through the Phase 2B read-only path",
  "no DB schema or migration authority",
  "no DB write authority",
  "no proof/evidence write authority",
  "no durable Perspective apply authority",
  "no provider, GitHub, or Codex execution authority",
  "no Human Surface or GuideBrief authority",
  "no external side effect authority",
];

const PRIVATE_MARKERS = [
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
  "raw conversation",
  "hidden reasoning",
] as const;

export type CurrentWorkingPerspectiveReadErrorCode =
  | ReadonlyApiAccessErrorCode
  | ReadonlyApiAuthScopeErrorCodeV0
  | "invalid_scope"
  | "unavailable";

export type CurrentWorkingPerspectiveReadErrorStatus =
  | ReadonlyApiAccessErrorStatus
  | ReadonlyApiAuthScopeFailureV0["status"]
  | 500;

export type CurrentWorkingPerspectiveReadValidationResult =
  | {
      ok: true;
      scope: typeof CURRENT_WORKING_PERSPECTIVE_ROUTE_SCOPE;
      route_id: typeof CURRENT_WORKING_PERSPECTIVE_ROUTE_ID;
      route_family: typeof CURRENT_WORKING_PERSPECTIVE_ROUTE_FAMILY;
      local_authorized: true;
    }
  | {
      ok: false;
      code: CurrentWorkingPerspectiveReadErrorCode;
      status: CurrentWorkingPerspectiveReadErrorStatus;
      authority_boundary: string[];
    };

export type CurrentWorkingPerspectiveReadErrorBody = {
  response_version: "current_working_perspective_route_response.v0.1";
  runtime: "augnes";
  perspective_version: typeof PERSPECTIVE_VERSION;
  projection_version: typeof PROJECTION_VERSION;
  snapshot_version: typeof SNAPSHOT_VERSION;
  error: {
    code: CurrentWorkingPerspectiveReadErrorCode;
    status: CurrentWorkingPerspectiveReadErrorStatus;
  };
  authority_boundary: string[];
};

type RuntimeCurrentWorkingPerspectiveInput = CurrentWorkingPerspectiveInput & {
  source_gaps: CurrentWorkingPerspectiveGap[];
};

type ReadonlySqliteDatabase = {
  close: () => void;
  pragma: (source: string) => unknown;
  prepare: (source: string) => {
    all: (...params: unknown[]) => unknown[];
  };
};

type StateEntryRow = {
  id: string | null;
  state_key: string | null;
  temporal_scope: string | null;
  stability: string | null;
  change_type: string | null;
  source_agent_id: string | null;
  source_session_id: string | null;
  updated_at: string | null;
};

type ProposalRow = {
  id: string | null;
  state_key: string | null;
  status: string | null;
  proposed_at: string | null;
};

type EvidenceRow = {
  evidence_id: string | null;
  created_at: string | null;
};

type WorkItemRow = {
  work_id: string | null;
  title: string | null;
  status: string | null;
  priority: string | null;
  summary: string | null;
  next_action: string | null;
  user_attention_required: number | null;
  related_state_keys: string | null;
  updated_at: string | null;
};

type WorkEventRow = {
  id: string | null;
  work_id: string | null;
  actor: string | null;
  event_type: string | null;
  summary: string | null;
  result_status: string | null;
  result_kind: string | null;
  related_action_id: string | null;
  related_pr: string | null;
  related_state_keys: string | null;
  created_at: string | null;
};

type ActionRecordRow = {
  id: string | null;
  state_key: string | null;
  status: string | null;
  created_at: string | null;
};

type TensionRow = {
  id: string | null;
  state_key: string | null;
  title: string | null;
  description: string | null;
  severity: string | null;
  source_agent_id: string | null;
  source_session_id: string | null;
  created_at: string | null;
};

type WorkEventWithWorkId = {
  work_id: string;
  event: CurrentWorkingPerspectiveSnapshotInput["work_trace_basis"]["active"][number]["recent_events"][number];
};

export function validateCurrentWorkingPerspectiveReadRequest(
  request: Request,
): CurrentWorkingPerspectiveReadValidationResult {
  let url: URL;

  try {
    url = new URL(request.url);
  } catch {
    return readRouteError("malformed_request", 400);
  }

  const requestedScope = url.searchParams.get("scope");
  if (!requestedScope) {
    return readRouteError("missing_scope", 400);
  }

  if (requestedScope !== CURRENT_WORKING_PERSPECTIVE_ROUTE_SCOPE) {
    return readRouteError("invalid_scope", 400);
  }

  const localGuardResult = validateReadonlyApiLocalAccess(
    request,
    CURRENT_WORKING_PERSPECTIVE_ACCESS_POLICY,
  );

  if (!localGuardResult.ok) {
    return localGuardResult;
  }

  if (shouldUseReadonlyApiLocalDevAuthStrictMode(request)) {
    const localDevAuthResult = validateReadonlyApiLocalDevAuthAdapter({
      request,
      localGuardResult,
    });

    if (!localDevAuthResult.ok) {
      return {
        ok: false,
        code: localDevAuthResult.code,
        status: localDevAuthResult.status,
        authority_boundary: [...localDevAuthResult.authority_boundary.notes],
      };
    }
  }

  return {
    ok: true,
    scope: CURRENT_WORKING_PERSPECTIVE_ROUTE_SCOPE,
    route_id: CURRENT_WORKING_PERSPECTIVE_ROUTE_ID,
    route_family: CURRENT_WORKING_PERSPECTIVE_ROUTE_FAMILY,
    local_authorized: true,
  };
}

export function buildCurrentWorkingPerspectiveReadError({
  code,
  status,
  authorityBoundary = READ_ERROR_AUTHORITY_BOUNDARY,
}: {
  code: CurrentWorkingPerspectiveReadErrorCode;
  status: CurrentWorkingPerspectiveReadErrorStatus;
  authorityBoundary?: string[];
}): CurrentWorkingPerspectiveReadErrorBody {
  return {
    response_version: "current_working_perspective_route_response.v0.1",
    runtime: "augnes",
    perspective_version: PERSPECTIVE_VERSION,
    projection_version: PROJECTION_VERSION,
    snapshot_version: SNAPSHOT_VERSION,
    error: {
      code,
      status,
    },
    authority_boundary: authorityBoundary,
  };
}

export function collectCurrentWorkingPerspectiveInput({
  scope,
  asOf = new Date().toISOString(),
}: {
  scope: typeof CURRENT_WORKING_PERSPECTIVE_ROUTE_SCOPE;
  asOf?: string;
}): RuntimeCurrentWorkingPerspectiveInput {
  const snapshotContext = collectPerspectiveSnapshotInput({ scope, asOf });
  const deltaProjection = buildAugnesDeltaProjectionRuntimeReadModel({ scope });

  return {
    scope,
    as_of: maxIso(snapshotContext.snapshot.as_of, deltaProjection.as_of),
    snapshot: snapshotContext.snapshot,
    delta_projection: deltaProjection,
    project_constellation_refs: ["docs/PROJECT_CONSTELLATION_IA_V0_1.md"],
    next_phase_notes: [
      "Phase 3B exposes a GET-only read-only Current Working Perspective route.",
      "The source/composition helper reads existing Augnes records only through read-only wrappers.",
      "Human Surface and GuideBrief remain deferred to explicit future phases.",
    ],
    source_gaps: snapshotContext.gaps,
  };
}

export function buildCurrentWorkingPerspectiveRuntimeReadModel({
  scope,
}: {
  scope: typeof CURRENT_WORKING_PERSPECTIVE_ROUTE_SCOPE;
}): CurrentWorkingPerspective {
  const input = collectCurrentWorkingPerspectiveInput({ scope });
  const perspective = buildCurrentWorkingPerspective(input);

  return attachRuntimeSourceGaps(perspective, input.source_gaps);
}

function collectPerspectiveSnapshotInput({
  scope,
  asOf,
}: {
  scope: typeof CURRENT_WORKING_PERSPECTIVE_ROUTE_SCOPE;
  asOf: string;
}): {
  snapshot: CurrentWorkingPerspectiveSnapshotInput;
  gaps: CurrentWorkingPerspectiveGap[];
} {
  const gaps: CurrentWorkingPerspectiveGap[] = [];
  const db = openExistingReadonlyPerspectiveDatabase(gaps);

  if (!db) {
    return {
      snapshot: buildSnapshotInput({
        scope,
        asOf,
        gaps,
      }),
      gaps,
    };
  }

  try {
    const stateEntries = collectStateEntries(db, scope, gaps);
    const pendingProposals = collectPendingProposals(db, scope, gaps);
    const evidenceRecords = collectEvidenceRecords(db, scope, gaps);
    const workItems = collectWorkItems(db, scope, gaps);
    const workEvents = collectWorkEvents(db, scope, gaps);
    const actionRecords = collectActionRecords(db, scope, gaps);
    const tensions = collectOpenTensions(db, scope, gaps);

    return {
      snapshot: buildSnapshotInput({
        scope,
        asOf,
        gaps,
        stateEntries,
        pendingProposals,
        evidenceRecords,
        workItems,
        workEvents,
        actionRecords,
        tensions,
      }),
      gaps,
    };
  } finally {
    db.close();
  }
}

function openExistingReadonlyPerspectiveDatabase(
  gaps: CurrentWorkingPerspectiveGap[],
): ReadonlySqliteDatabase | null {
  try {
    const db = new Database(getDatabasePath(), {
      readonly: true,
      fileMustExist: true,
    }) as ReadonlySqliteDatabase;
    db.pragma("query_only = ON");
    return db;
  } catch {
    gaps.push(
      createCurrentWorkingPerspectiveGap({
        code: "perspective_snapshot_readonly_db_unavailable",
        severity: "high",
        summary:
          "Current Working Perspective route could not open an existing Augnes DB in read-only mode.",
        source_refs: [],
      }),
    );
    return null;
  }
}

function collectStateEntries(
  db: ReadonlySqliteDatabase,
  scope: string,
  gaps: CurrentWorkingPerspectiveGap[],
): StateEntryRow[] {
  return selectRows<StateEntryRow>({
    db,
    scope,
    gaps,
    gapCode: "perspective_snapshot_state_entries_unavailable",
    summary:
      "Current Working Perspective could not read state_entries in read-only mode.",
    sql: `
      SELECT
        id,
        state_key,
        temporal_scope,
        stability,
        change_type,
        source_agent_id,
        source_session_id,
        updated_at
      FROM state_entries
      WHERE scope = ?
      ORDER BY updated_at DESC, state_key ASC
      LIMIT ?
    `,
    limit: STATE_ENTRY_LIMIT * 4,
  });
}

function collectPendingProposals(
  db: ReadonlySqliteDatabase,
  scope: string,
  gaps: CurrentWorkingPerspectiveGap[],
): ProposalRow[] {
  return selectRows<ProposalRow>({
    db,
    scope,
    gaps,
    gapCode: "perspective_snapshot_pending_proposals_unavailable",
    summary:
      "Current Working Perspective could not read pending state_delta_proposals in read-only mode.",
    sql: `
      SELECT
        id,
        state_key,
        status,
        proposed_at
      FROM state_delta_proposals
      WHERE scope = ? AND status = 'pending'
      ORDER BY proposed_at DESC, id ASC
      LIMIT ?
    `,
    limit: PROPOSAL_LIMIT,
  });
}

function collectEvidenceRecords(
  db: ReadonlySqliteDatabase,
  scope: string,
  gaps: CurrentWorkingPerspectiveGap[],
): EvidenceRow[] {
  return selectRows<EvidenceRow>({
    db,
    scope,
    gaps,
    gapCode: "perspective_snapshot_evidence_records_unavailable",
    summary:
      "Current Working Perspective could not read verification_evidence_records in read-only mode.",
    sql: `
      SELECT
        evidence_id,
        created_at
      FROM verification_evidence_records
      WHERE scope = ?
      ORDER BY created_at DESC, evidence_id ASC
      LIMIT ?
    `,
    limit: EVIDENCE_LIMIT,
  });
}

function collectWorkItems(
  db: ReadonlySqliteDatabase,
  scope: string,
  gaps: CurrentWorkingPerspectiveGap[],
): WorkItemRow[] {
  return selectRows<WorkItemRow>({
    db,
    scope,
    gaps,
    gapCode: "perspective_snapshot_work_items_unavailable",
    summary:
      "Current Working Perspective could not read work_items in read-only mode.",
    sql: `
      SELECT
        work_id,
        title,
        status,
        priority,
        summary,
        next_action,
        user_attention_required,
        related_state_keys,
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
      LIMIT ?
    `,
    limit: WORK_LIMIT,
  });
}

function collectWorkEvents(
  db: ReadonlySqliteDatabase,
  scope: string,
  gaps: CurrentWorkingPerspectiveGap[],
): WorkEventRow[] {
  return selectRows<WorkEventRow>({
    db,
    scope,
    gaps,
    gapCode: "perspective_snapshot_work_events_unavailable",
    summary:
      "Current Working Perspective could not read work_events in read-only mode.",
    sql: `
      SELECT
        id,
        work_id,
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
      WHERE scope = ?
      ORDER BY created_at DESC, id ASC
      LIMIT ?
    `,
    limit: WORK_EVENT_LIMIT,
  });
}

function collectActionRecords(
  db: ReadonlySqliteDatabase,
  scope: string,
  gaps: CurrentWorkingPerspectiveGap[],
): ActionRecordRow[] {
  return selectRows<ActionRecordRow>({
    db,
    scope,
    gaps,
    gapCode: "perspective_snapshot_action_records_unavailable",
    summary:
      "Current Working Perspective could not read action_records in read-only mode.",
    sql: `
      SELECT
        id,
        state_key,
        status,
        created_at
      FROM action_records
      WHERE scope = ?
      ORDER BY created_at DESC, id ASC
      LIMIT ?
    `,
    limit: ACTION_LIMIT,
  });
}

function collectOpenTensions(
  db: ReadonlySqliteDatabase,
  scope: string,
  gaps: CurrentWorkingPerspectiveGap[],
): TensionRow[] {
  return selectRows<TensionRow>({
    db,
    scope,
    gaps,
    gapCode: "perspective_snapshot_open_tensions_unavailable",
    summary:
      "Current Working Perspective could not read open state_tensions in read-only mode.",
    sql: `
      SELECT
        id,
        state_key,
        title,
        description,
        severity,
        source_agent_id,
        source_session_id,
        created_at
      FROM state_tensions
      WHERE scope = ? AND status = 'open'
      ORDER BY severity DESC, created_at ASC, id ASC
      LIMIT ?
    `,
    limit: TENSION_LIMIT,
  });
}

function selectRows<T>({
  db,
  scope,
  gaps,
  gapCode,
  summary,
  sql,
  limit,
}: {
  db: ReadonlySqliteDatabase;
  scope: string;
  gaps: CurrentWorkingPerspectiveGap[];
  gapCode: string;
  summary: string;
  sql: string;
  limit: number;
}): T[] {
  try {
    return db.prepare(sql).all(scope, limit) as T[];
  } catch {
    gaps.push(
      createCurrentWorkingPerspectiveGap({
        code: gapCode,
        severity: "medium",
        summary,
        source_refs: [],
      }),
    );
    return [];
  }
}

function buildSnapshotInput({
  scope,
  asOf,
  gaps,
  stateEntries = [],
  pendingProposals = [],
  evidenceRecords = [],
  workItems = [],
  workEvents = [],
  actionRecords = [],
  tensions = [],
}: {
  scope: typeof CURRENT_WORKING_PERSPECTIVE_ROUTE_SCOPE;
  asOf: string;
  gaps: CurrentWorkingPerspectiveGap[];
  stateEntries?: StateEntryRow[];
  pendingProposals?: ProposalRow[];
  evidenceRecords?: EvidenceRow[];
  workItems?: WorkItemRow[];
  workEvents?: WorkEventRow[];
  actionRecords?: ActionRecordRow[];
  tensions?: TensionRow[];
}): CurrentWorkingPerspectiveSnapshotInput {
  const safeStateEntries = stateEntries.map(mapStateEntry).filter(isPresent);
  const groupedState = groupStateBasisItems(safeStateEntries);
  const safeWorkEvents = workEvents.map(mapWorkEvent).filter(isPresent);
  const workEventsByWorkId = groupWorkEventsByWorkId(safeWorkEvents);
  const safeWorkItems = workItems.map((row) =>
    mapWorkItem(row, workEventsByWorkId),
  ).filter(isPresent);
  const safeProposalIds = pendingProposals
    .map((proposal) => safeRef(proposal.id))
    .filter(isPresent);
  const safeEvidenceIds = evidenceRecords
    .map((record) => safeRef(record.evidence_id))
    .filter(isPresent);
  const safeActionRows = actionRecords.map(mapActionRecord).filter(isPresent);
  const safeTensions = tensions.map(mapTension).filter(isPresent);
  const activeWork = safeWorkItems.filter((work) =>
    ["planned", "in_progress", "blocked", "needs_review"].includes(
      normalizeToken(work.status),
    ),
  );
  const pressureLevel = pressureFromCount(safeProposalIds.length);
  const loopnessLevel = pressureFromCount(
    safeProposalIds.length + safeTensions.length,
  );
  const missingContext = buildMissingContext(gaps);

  return {
    runtime: "augnes",
    snapshot_version: SNAPSHOT_VERSION,
    scope,
    as_of: asOf,
    source_refs: {
      state_brief_as_of: asOf,
      state_entry_ids: safeStateEntries.map((entry) => entry.id),
      pending_proposal_ids: safeProposalIds,
      evidence_ids: safeEvidenceIds,
      work_ids: safeWorkItems.map((work) => work.work_id),
      work_event_ids: safeWorkEvents.map(({ event }) => event.id),
      action_record_ids: safeActionRows.map((action) => action.id),
      tension_ids: safeTensions.map((tension) => tension.id),
      execution_lane_ids: [],
    },
    committed_state_basis: {
      summary:
        safeStateEntries.length > 0
          ? `Read-only snapshot context includes ${safeStateEntries.length} committed state basis refs.`
          : "No committed state basis refs were found through the read-only runtime source helper.",
      active: groupedState.active,
      future: groupedState.future,
      completed: groupedState.completed,
      deprecated: groupedState.deprecated,
    },
    pending_proposal_pressure: {
      count: safeProposalIds.length,
      pressure_level: pressureLevel,
      summary_reason:
        safeProposalIds.length > 0
          ? "Pending proposals are pressure only; they require explicit Core commit/reject before durable state changes."
          : "No pending proposals were found for this scope.",
    },
    evidence_basis: {
      count: safeEvidenceIds.length,
      summary_reason:
        safeEvidenceIds.length > 0
          ? "Verification evidence refs are included as trace context only."
          : "No verification evidence refs were found for this scope.",
    },
    work_trace_basis: {
      count: safeWorkItems.length,
      active: activeWork,
      summary_reason:
        safeWorkItems.length > 0
          ? "Work trace refs are included as read-only Current Working Perspective context."
          : "No work trace refs were found for this scope.",
    },
    action_trace_basis: {
      count: safeActionRows.length,
      summary_reason:
        safeActionRows.length > 0
          ? "Action records are trace context only and grant no proof or approval authority."
          : "No action record refs were found for this scope.",
    },
    open_tensions: {
      count: safeTensions.length,
      items: safeTensions,
    },
    current_frame: {
      summary: buildCurrentFrameSummary({
        stateCount: safeStateEntries.length,
        activeWorkCount: activeWork.length,
        gapCount: gaps.length,
      }),
      primary_state_keys: uniqueSorted(
        safeStateEntries.map((entry) => entry.state_key),
      ).slice(0, 8),
      active_work_ids: activeWork.map((work) => work.work_id),
      pressure_level: maxPressure([pressureLevel, loopnessLevel]),
    },
    boundary_next: {
      title: "Review current read-only perspective packet",
      rationale:
        "Phase 3B exposes runtime source context for downstream Human Surface consumers without applying state.",
      suggested_actor: "operator",
      priority: gaps.some((gap) => gap.severity === "high")
        ? "review_source_gaps"
        : "normal",
      related_state_keys: uniqueSorted(
        safeStateEntries.map((entry) => entry.state_key),
      ).slice(0, 8),
      allowed_next_steps: [
        "Inspect Current Working Perspective source refs, gaps, and review hints.",
        "Use the packet as read-only input for a future Human Surface phase.",
      ],
      forbidden_next_steps: [
        "Do not apply, approve, publish, merge, retry, replay, deploy, mutate memory, or write proof/evidence from this route.",
      ],
    },
    missing_context: missingContext,
    research_diagnostics: {
      mode: "log_only",
      loopness_hint: {
        version: "loopness_hint.v0.1",
        mode: "log_only",
        score: Math.min(1, (safeProposalIds.length + safeTensions.length) / 10),
        level: loopnessLevel,
        source_refs: {
          action_record_ids: safeActionRows.map((action) => action.id),
          work_event_ids: safeWorkEvents.map(({ event }) => event.id),
          pending_proposal_ids: safeProposalIds,
          tension_ids: safeTensions.map((tension) => tension.id),
        },
        notes: [
          "Runtime loopness hint is log-only.",
          "It is not truth, proof, approval, readiness, committed Perspective state, or proposal scoring input.",
        ],
      },
      notes: [
        "Research diagnostics are non-authoritative in the runtime Current Working Perspective route.",
        "Diagnostics do not write evidence, proof, memory, or Perspective state.",
      ],
    },
  };
}

function mapStateEntry(
  row: StateEntryRow,
): CurrentWorkingPerspectiveSnapshotInput["committed_state_basis"]["active"][number] | null {
  const id = safeRef(row.id);
  const stateKey = publicSafeText(row.state_key, 160);

  if (!id || !stateKey) {
    return null;
  }

  return {
    id,
    state_key: stateKey,
    temporal_scope: publicSafeText(row.temporal_scope, 80) ?? "current",
    stability: publicSafeText(row.stability, 80) ?? "unknown",
    change_type: publicSafeText(row.change_type, 80) ?? "unknown",
    source_agent_id: safeRef(row.source_agent_id),
    source_session_id: safeRef(row.source_session_id),
    updated_at: publicSafeText(row.updated_at, 80) ?? new Date(0).toISOString(),
  };
}

function mapWorkItem(
  row: WorkItemRow,
  workEventsByWorkId: Map<
    string,
    CurrentWorkingPerspectiveSnapshotInput["work_trace_basis"]["active"][number]["recent_events"]
  >,
): CurrentWorkingPerspectiveSnapshotInput["work_trace_basis"]["active"][number] | null {
  const workId = safeRef(row.work_id);
  if (!workId) {
    return null;
  }

  return {
    work_id: workId,
    title: publicSafeText(row.title, 180) ?? `Work ${workId}`,
    status: publicSafeText(row.status, 80) ?? "unknown",
    priority: publicSafeText(row.priority, 80) ?? "normal",
    summary:
      publicSafeText(row.summary, TEXT_LIMIT) ??
      "Work summary omitted by public-safety filter.",
    next_action:
      publicSafeText(row.next_action, TEXT_LIMIT) ??
      "Review work item in the source system.",
    user_attention_required: Boolean(row.user_attention_required),
    related_state_keys: safeJsonStringArray(row.related_state_keys),
    recent_events: workEventsByWorkId.get(workId) ?? [],
    updated_at: publicSafeText(row.updated_at, 80) ?? new Date(0).toISOString(),
  };
}

function mapWorkEvent(
  row: WorkEventRow,
): WorkEventWithWorkId | null {
  const id = safeRef(row.id);
  const workId = safeRef(row.work_id);
  if (!id || !workId) {
    return null;
  }

  return {
    work_id: workId,
    event: {
      id,
      actor: publicSafeText(row.actor, 80) ?? "unknown",
      event_type: publicSafeText(row.event_type, 80) ?? "note",
      summary:
        publicSafeText(row.summary, TEXT_LIMIT) ??
        "Work event summary omitted by public-safety filter.",
      result_status: publicSafeText(row.result_status, 80),
      result_kind: publicSafeText(row.result_kind, 80),
      related_action_id: safeRef(row.related_action_id),
      related_pr: safeRef(row.related_pr),
      related_state_keys: safeJsonStringArray(row.related_state_keys),
      created_at: publicSafeText(row.created_at, 80) ?? new Date(0).toISOString(),
    },
  };
}

function mapActionRecord(row: ActionRecordRow): { id: string } | null {
  const id = safeRef(row.id);
  return id ? { id } : null;
}

function mapTension(
  row: TensionRow,
): CurrentWorkingPerspectiveSnapshotInput["open_tensions"]["items"][number] | null {
  const id = safeRef(row.id);
  if (!id) {
    return null;
  }

  return {
    id,
    state_key: publicSafeText(row.state_key, 160),
    title: publicSafeText(row.title, 180) ?? "Open tension",
    description:
      publicSafeText(row.description, TEXT_LIMIT) ??
      "Open tension description omitted by public-safety filter.",
    severity: publicSafeText(row.severity, 80) ?? "medium",
    source_agent_id: safeRef(row.source_agent_id),
    source_session_id: safeRef(row.source_session_id),
    created_at: publicSafeText(row.created_at, 80) ?? new Date(0).toISOString(),
  };
}

function attachRuntimeSourceGaps(
  perspective: CurrentWorkingPerspective,
  sourceGaps: CurrentWorkingPerspectiveGap[],
): CurrentWorkingPerspective {
  if (sourceGaps.length === 0) {
    return perspective;
  }

  const gaps = uniqueGaps([...perspective.gaps, ...sourceGaps]);
  const stalenessStatus = gaps.some((gap) => gap.severity === "high")
    ? "partial"
    : perspective.staleness.status;

  return {
    ...perspective,
    gaps,
    staleness: {
      ...perspective.staleness,
      status: stalenessStatus,
      freshness_notes: uniqueSorted([
        ...perspective.staleness.freshness_notes,
        "Runtime source composition added read-only source gaps.",
      ]),
      source_gap_codes: uniqueSorted([
        ...perspective.staleness.source_gap_codes,
        ...sourceGaps.map((gap) => gap.code),
      ]),
    },
  };
}

function groupStateBasisItems(
  items: CurrentWorkingPerspectiveSnapshotInput["committed_state_basis"]["active"],
): CurrentWorkingPerspectiveSnapshotInput["committed_state_basis"] {
  const groups: CurrentWorkingPerspectiveSnapshotInput["committed_state_basis"] = {
    summary: "",
    active: [],
    future: [],
    completed: [],
    deprecated: [],
  };

  for (const item of items) {
    const token = normalizeToken(item.temporal_scope);
    if (token.includes("future")) {
      groups.future.push(item);
    } else if (token.includes("completed") || token.includes("past")) {
      groups.completed.push(item);
    } else if (token.includes("deprecated")) {
      groups.deprecated.push(item);
    } else {
      groups.active.push(item);
    }
  }

  return {
    summary: "",
    active: groups.active.slice(0, STATE_ENTRY_LIMIT),
    future: groups.future.slice(0, STATE_ENTRY_LIMIT),
    completed: groups.completed.slice(0, STATE_ENTRY_LIMIT),
    deprecated: groups.deprecated.slice(0, STATE_ENTRY_LIMIT),
  };
}

function groupWorkEventsByWorkId(
  events: WorkEventWithWorkId[],
) {
  const byWorkId = new Map<
    string,
    CurrentWorkingPerspectiveSnapshotInput["work_trace_basis"]["active"][number]["recent_events"]
  >();

  for (const event of events) {
    const existing = byWorkId.get(event.work_id) ?? [];
    existing.push(event.event);
    byWorkId.set(event.work_id, existing.slice(0, 4));
  }

  return byWorkId;
}

function buildMissingContext(gaps: CurrentWorkingPerspectiveGap[]) {
  if (gaps.length === 0) {
    return [];
  }

  return gaps.map((gap) => `Source gap: ${gap.summary}`);
}

function buildCurrentFrameSummary({
  stateCount,
  activeWorkCount,
  gapCount,
}: {
  stateCount: number;
  activeWorkCount: number;
  gapCount: number;
}) {
  if (gapCount > 0) {
    return `Current Working Perspective runtime read model is partial with ${gapCount} source gaps.`;
  }

  return `Current Working Perspective runtime read model includes ${stateCount} state refs and ${activeWorkCount} active work refs.`;
}

function pressureFromCount(count: number) {
  if (count <= 0) return "none";
  if (count <= 2) return "low";
  if (count <= 5) return "medium";
  return "high";
}

function maxPressure(
  levels: Array<"none" | "low" | "medium" | "high">,
): "none" | "low" | "medium" | "high" {
  const order = { none: 0, low: 1, medium: 2, high: 3 } as const;
  return levels.reduce<"none" | "low" | "medium" | "high">(
    (max, level) => (order[level] > order[max] ? level : max),
    "none",
  );
}

function readRouteError(
  code: CurrentWorkingPerspectiveReadErrorCode,
  status: CurrentWorkingPerspectiveReadErrorStatus,
): CurrentWorkingPerspectiveReadValidationResult {
  return {
    ok: false,
    code,
    status,
    authority_boundary: READ_ERROR_AUTHORITY_BOUNDARY,
  };
}

function uniqueGaps(gaps: CurrentWorkingPerspectiveGap[]) {
  const byCode = new Map<string, CurrentWorkingPerspectiveGap>();
  for (const gap of gaps) {
    byCode.set(gap.code, gap);
  }
  return [...byCode.values()];
}

function safeJsonStringArray(value: string | null): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? uniqueSorted(parsed.map((item) => publicSafeText(item, 160)).filter(isPresent))
      : [];
  } catch {
    return [];
  }
}

function safeRef(value: string | null | undefined): string | null {
  return publicSafeText(value, 180)?.replace(/\s+/g, "-") ?? null;
}

function publicSafeText(
  value: unknown,
  maxLength: number,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed || PRIVATE_MARKERS.some((marker) => trimmed.includes(marker))) {
    return null;
  }

  return trimmed.slice(0, maxLength);
}

function normalizeToken(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase().replace(/[^a-z0-9_:-]+/g, "_");
}

function maxIso(left: string, right: string) {
  return left.localeCompare(right) >= 0 ? left : right;
}

function uniqueSorted(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter(isString))].sort();
}

function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

function isString(value: string | null | undefined): value is string {
  return typeof value === "string";
}
