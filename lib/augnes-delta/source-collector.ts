import Database from "better-sqlite3";

import { createProjectionGap } from "@/lib/augnes-delta/projector";
import { buildAugnesDeltaProjectionReadModel } from "@/lib/augnes-delta/projector";
import { getDatabasePath } from "@/lib/db";
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
import type { ResearchDiagnosticRef, SnapshotRef } from "@/types/augnes-delta";
import type {
  AugnesDeltaProjectionActionRecordInput,
  AugnesDeltaProjectionCodexResultTraceInput,
  AugnesDeltaProjectionCoordinationEventInput,
  AugnesDeltaProjectionDogfoodingRecordInput,
  AugnesDeltaProjectionEvidenceRecordInput,
  AugnesDeltaProjectionGap,
  AugnesDeltaProjectionGapSeverity,
  AugnesDeltaProjectionHandoffTraceInput,
  AugnesDeltaProjectionInput,
  AugnesDeltaProjectionReadModel,
  AugnesDeltaProjectionSourceKind,
  AugnesDeltaProjectionStateDeltaProposalInput,
  AugnesDeltaProjectionWorkEventInput,
} from "@/types/augnes-delta-projection";
import type {
  ReadonlyApiAuthScopeErrorCodeV0,
  ReadonlyApiAuthScopeFailureV0,
} from "@/types/readonly-api-auth-scope";

export const AUGNES_DELTA_PROJECTION_ROUTE_SCOPE = "project:augnes";
export const AUGNES_DELTA_PROJECTION_LOCAL_READ_HEADER =
  "x-augnes-local-readonly";
export const AUGNES_DELTA_PROJECTION_LOCAL_READ_MARKER =
  "augnes-delta-projection-v0.1";
export const AUGNES_DELTA_PROJECTION_ROUTE_FAMILY =
  "augnes_delta_projection";
export const AUGNES_DELTA_PROJECTION_ROUTE_ID =
  "augnes.read.deltas.v0.1";
export const AUGNES_DELTA_PROJECTION_CACHE_CONTROL = "no-store";
export const AUGNES_DELTA_PROJECTION_ACCESS_POLICY: ReadonlyApiAccessPolicy = {
  route_id: AUGNES_DELTA_PROJECTION_ROUTE_ID,
  required_scope: AUGNES_DELTA_PROJECTION_ROUTE_SCOPE,
  required_marker_header: AUGNES_DELTA_PROJECTION_LOCAL_READ_HEADER,
  required_marker_value: AUGNES_DELTA_PROJECTION_LOCAL_READ_MARKER,
  allowed_hosts: READONLY_LOCAL_HOSTS,
  route_family: AUGNES_DELTA_PROJECTION_ROUTE_FAMILY,
};

const CONTRACT_VERSION = "augnes_delta_contract.v0.1" as const;
const PROJECTION_VERSION = "augnes_delta_projection.v0.1" as const;
const SOURCE_LIMIT = 100;

const ERROR_AUTHORITY_BOUNDARY = [
  "GET-only local read-only Delta Projection route",
  "fail-closed scope and local marker validation",
  "read-only existing DB open only",
  "no DB schema or migration authority",
  "no DB write authority",
  "no proof/evidence write authority",
  "no durable Perspective apply authority",
  "no provider, GitHub, or Codex execution authority",
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

export type AugnesDeltaProjectionReadErrorCode =
  | ReadonlyApiAccessErrorCode
  | ReadonlyApiAuthScopeErrorCodeV0
  | "invalid_scope"
  | "unavailable";

export type AugnesDeltaProjectionReadErrorStatus =
  | ReadonlyApiAccessErrorStatus
  | ReadonlyApiAuthScopeFailureV0["status"]
  | 500;

export type AugnesDeltaProjectionReadValidationResult =
  | {
      ok: true;
      scope: typeof AUGNES_DELTA_PROJECTION_ROUTE_SCOPE;
      route_id: typeof AUGNES_DELTA_PROJECTION_ROUTE_ID;
      route_family: typeof AUGNES_DELTA_PROJECTION_ROUTE_FAMILY;
      local_authorized: true;
    }
  | {
      ok: false;
      code: AugnesDeltaProjectionReadErrorCode;
      status: AugnesDeltaProjectionReadErrorStatus;
      authority_boundary: string[];
    };

export type AugnesDeltaProjectionReadErrorBody = {
  response_version: "augnes_delta_projection_route_response.v0.1";
  runtime: "augnes";
  projection_version: typeof PROJECTION_VERSION;
  contract_version: typeof CONTRACT_VERSION;
  error: {
    code: AugnesDeltaProjectionReadErrorCode;
    status: AugnesDeltaProjectionReadErrorStatus;
  };
  authority_boundary: string[];
};

type ReadonlySqliteDatabase = {
  close: () => void;
  pragma: (source: string) => unknown;
  prepare: (source: string) => {
    all: (...params: unknown[]) => unknown[];
    get: (...params: unknown[]) => unknown;
  };
};

type StateDeltaProposalRow = {
  id: string;
  scope: string;
  state_key: string;
  operation: string | null;
  temporal_scope: string | null;
  change_type: string | null;
  source_agent_id: string | null;
  source_session_id: string | null;
  reason: string | null;
  status: string | null;
  proposed_at: string | null;
};

type WorkEventRow = {
  id: string;
  work_id: string | null;
  scope: string;
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

type CoordinationEventRow = {
  event_id: string;
  event_type: string | null;
  scope: string;
  work_id: string | null;
  actor: string | null;
  target: string | null;
  source_surface: string | null;
  authority_level: string | null;
  state_keys: string | null;
  causal_parent_id: string | null;
  payload_ref: string | null;
  result_status: string | null;
  created_at: string | null;
};

type ActionRecordRow = {
  id: string;
  scope: string;
  state_key: string | null;
  title: string | null;
  description: string | null;
  status: string | null;
  source_agent_id: string | null;
  source_session_id: string | null;
  created_at: string | null;
  completed_at: string | null;
};

type EvidenceRecordRow = {
  evidence_id: string;
  scope: string;
  work_id: string | null;
  publication_id: string | null;
  delivery_id: string | null;
  target_surface: string | null;
  target_ref: string | null;
  evidence_kind: string | null;
  label: string | null;
  status: string | null;
  result_summary: string | null;
  skipped_reason: string | null;
  observed_behavior: string | null;
  source_surface: string | null;
  source_ref: string | null;
  related_action_id: string | null;
  related_work_event_id: string | null;
  created_by: string | null;
  created_at: string | null;
};

type DogfoodingRecordRow = {
  record_id: string;
  scope: string;
  status: string | null;
  operator_actor_ref: string | null;
  recorded_at: string | null;
  bounded_context_summary: string | null;
  public_safe: number | null;
};

type DogfoodingSignalRow = {
  record_id: string;
  signal_id: string;
};

export function validateAugnesDeltaProjectionReadRequest(
  request: Request,
): AugnesDeltaProjectionReadValidationResult {
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

  if (requestedScope !== AUGNES_DELTA_PROJECTION_ROUTE_SCOPE) {
    return readRouteError("invalid_scope", 400);
  }

  const localGuardResult = validateReadonlyApiLocalAccess(
    request,
    AUGNES_DELTA_PROJECTION_ACCESS_POLICY,
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
    scope: AUGNES_DELTA_PROJECTION_ROUTE_SCOPE,
    route_id: AUGNES_DELTA_PROJECTION_ROUTE_ID,
    route_family: AUGNES_DELTA_PROJECTION_ROUTE_FAMILY,
    local_authorized: true,
  };
}

export function buildAugnesDeltaProjectionReadError({
  code,
  status,
  authorityBoundary = ERROR_AUTHORITY_BOUNDARY,
}: {
  code: AugnesDeltaProjectionReadErrorCode;
  status: AugnesDeltaProjectionReadErrorStatus;
  authorityBoundary?: string[];
}): AugnesDeltaProjectionReadErrorBody {
  return {
    response_version: "augnes_delta_projection_route_response.v0.1",
    runtime: "augnes",
    projection_version: PROJECTION_VERSION,
    contract_version: CONTRACT_VERSION,
    error: {
      code,
      status,
    },
    authority_boundary: authorityBoundary,
  };
}

export function collectAugnesDeltaProjectionInput({
  scope,
  asOf = new Date().toISOString(),
}: {
  scope: typeof AUGNES_DELTA_PROJECTION_ROUTE_SCOPE;
  asOf?: string;
}): AugnesDeltaProjectionInput {
  const gaps: AugnesDeltaProjectionGap[] = [];
  const db = openExistingReadonlyProjectionDatabase(gaps);

  if (!db) {
    return buildProjectionInput({
      scope,
      asOf,
      gaps,
      snapshotRefs: [],
      diagnosticRefs: buildRuntimeDiagnosticRefs(gaps),
    });
  }

  try {
    const stateDeltaProposals = collectStateDeltaProposals(db, scope, gaps);
    const workEvents = collectWorkEvents(db, scope, gaps);
    const coordinationEvents = collectCoordinationEvents(db, scope, gaps);
    const actionRecords = collectActionRecords(db, scope, gaps);
    const evidenceRecords = collectEvidenceRecords(db, scope, gaps);
    const dogfoodingRecords = collectDogfoodingRecords(db, scope, gaps);
    const handoffTraces = collectHandoffTraces(coordinationEvents);
    const codexResultTraces = collectCodexResultTraces(workEvents);
    const snapshotRefs = [
      buildRuntimeSnapshotRef({
        asOf,
        stateDeltaProposals,
        workEvents,
        coordinationEvents,
        actionRecords,
        evidenceRecords,
        dogfoodingRecords,
        handoffTraces,
        codexResultTraces,
      }),
    ];
    const diagnosticRefs = buildRuntimeDiagnosticRefs(gaps);

    return buildProjectionInput({
      scope,
      asOf,
      stateDeltaProposals,
      workEvents,
      coordinationEvents,
      actionRecords,
      evidenceRecords,
      dogfoodingRecords,
      handoffTraces,
      codexResultTraces,
      snapshotRefs,
      diagnosticRefs,
      gaps,
    });
  } finally {
    db.close();
  }
}

export function buildAugnesDeltaProjectionRuntimeReadModel({
  scope,
}: {
  scope: typeof AUGNES_DELTA_PROJECTION_ROUTE_SCOPE;
}): AugnesDeltaProjectionReadModel {
  return buildAugnesDeltaProjectionReadModel(
    collectAugnesDeltaProjectionInput({ scope }),
  );
}

function buildProjectionInput({
  scope,
  asOf,
  stateDeltaProposals = [],
  workEvents = [],
  coordinationEvents = [],
  actionRecords = [],
  evidenceRecords = [],
  dogfoodingRecords = [],
  handoffTraces = [],
  codexResultTraces = [],
  snapshotRefs = [],
  diagnosticRefs = [],
  gaps,
}: {
  scope: typeof AUGNES_DELTA_PROJECTION_ROUTE_SCOPE;
  asOf: string;
  stateDeltaProposals?: AugnesDeltaProjectionStateDeltaProposalInput[];
  workEvents?: AugnesDeltaProjectionWorkEventInput[];
  coordinationEvents?: AugnesDeltaProjectionCoordinationEventInput[];
  actionRecords?: AugnesDeltaProjectionActionRecordInput[];
  evidenceRecords?: AugnesDeltaProjectionEvidenceRecordInput[];
  dogfoodingRecords?: AugnesDeltaProjectionDogfoodingRecordInput[];
  handoffTraces?: AugnesDeltaProjectionHandoffTraceInput[];
  codexResultTraces?: AugnesDeltaProjectionCodexResultTraceInput[];
  snapshotRefs?: SnapshotRef[];
  diagnosticRefs?: ResearchDiagnosticRef[];
  gaps: AugnesDeltaProjectionGap[];
}): AugnesDeltaProjectionInput {
  return {
    scope,
    as_of: asOf,
    state_delta_proposals: stateDeltaProposals,
    work_events: workEvents,
    coordination_events: coordinationEvents,
    action_records: actionRecords,
    evidence_records: evidenceRecords,
    dogfooding_records: dogfoodingRecords,
    handoff_traces: handoffTraces,
    codex_result_traces: codexResultTraces,
    snapshot_refs: snapshotRefs,
    diagnostic_refs: diagnosticRefs,
    gaps,
    next_phase_notes: [
      "Phase 2B exposes a GET-only read-only projection route for Current Working Perspective consumers.",
      "Source records remain authoritative; this route returns projection metadata only.",
      "Optional source families are gap-reported when missing or unsafe.",
      "Codex result traces are derived only from structured work-event refs; no result text is reconstructed.",
    ],
  };
}

function openExistingReadonlyProjectionDatabase(
  gaps: AugnesDeltaProjectionGap[],
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
      collectorGap({
        code: "runtime_readonly_db_unavailable",
        severity: "high",
        source_kind: "unknown",
        summary:
          "Delta projection runtime read surface could not open an existing Augnes DB in read-only mode.",
        details: [
          "No DB file, schema, migration, or source record was created by this collector.",
          "The route can still return a projection read model with explicit gaps.",
        ],
      }),
    );
    return null;
  }
}

function collectStateDeltaProposals(
  db: ReadonlySqliteDatabase,
  scope: string,
  gaps: AugnesDeltaProjectionGap[],
): AugnesDeltaProjectionStateDeltaProposalInput[] {
  const rows = selectProjectionRows<StateDeltaProposalRow>({
    db,
    table: "state_delta_proposals",
    sourceKind: "state_delta_proposal",
    gapCode: "state_delta_proposals_unavailable",
    scope,
    gaps,
    sql: `
      SELECT
        id,
        scope,
        state_key,
        operation,
        temporal_scope,
        change_type,
        source_agent_id,
        source_session_id,
        reason,
        status,
        proposed_at
      FROM state_delta_proposals
      WHERE scope = ?
      ORDER BY proposed_at DESC, id ASC
      LIMIT ?
    `,
  });

  return rows
    .map((row) => {
      const id = safeRef(row.id);
      if (!id) return null;

      return {
        id,
        scope: safeRef(row.scope) ?? scope,
        state_key: safeText(row.state_key, 160) ?? undefined,
        status: safeText(row.status, 80),
        change_type: safeText(row.change_type, 80),
        operation: safeText(row.operation, 80),
        temporal_scope: safeText(row.temporal_scope, 80),
        reason: safeText(row.reason, 360),
        proposed_at: safeText(row.proposed_at, 80),
        source_agent_id: safeRef(row.source_agent_id),
        source_session_id: safeRef(row.source_session_id),
      };
    })
    .filter(isPresent);
}

function collectWorkEvents(
  db: ReadonlySqliteDatabase,
  scope: string,
  gaps: AugnesDeltaProjectionGap[],
): AugnesDeltaProjectionWorkEventInput[] {
  const rows = selectProjectionRows<WorkEventRow>({
    db,
    table: "work_events",
    sourceKind: "work_event",
    gapCode: "work_events_unavailable",
    scope,
    gaps,
    sql: `
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
      WHERE scope = ?
      ORDER BY created_at DESC, id ASC
      LIMIT ?
    `,
  });

  return rows
    .map((row) => {
      const id = safeRef(row.id);
      if (!id) return null;

      return {
        id,
        work_id: safeRef(row.work_id),
        scope: safeRef(row.scope) ?? scope,
        actor: safeRef(row.actor),
        event_type: safeText(row.event_type, 80),
        summary: safeText(
          row.summary,
          360,
          "Projected WorkEvent trace summary omitted by public-safety filter.",
        ),
        result_status: safeText(row.result_status, 80),
        result_kind: safeText(row.result_kind, 80),
        related_action_id: safeRef(row.related_action_id),
        related_pr: safeRef(row.related_pr),
        related_state_keys: safeJsonStringArray(row.related_state_keys),
        created_at: safeText(row.created_at, 80),
      };
    })
    .filter(isPresent);
}

function collectCoordinationEvents(
  db: ReadonlySqliteDatabase,
  scope: string,
  gaps: AugnesDeltaProjectionGap[],
): AugnesDeltaProjectionCoordinationEventInput[] {
  const rows = selectProjectionRows<CoordinationEventRow>({
    db,
    table: "coordination_events",
    sourceKind: "coordination_event",
    gapCode: "coordination_events_unavailable",
    scope,
    gaps,
    sql: `
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
      WHERE scope = ?
      ORDER BY created_at DESC, event_id ASC
      LIMIT ?
    `,
  });

  return rows
    .map((row) => {
      const eventId = safeRef(row.event_id);
      if (!eventId) return null;

      return {
        event_id: eventId,
        event_type: safeText(row.event_type, 80),
        scope: safeRef(row.scope) ?? scope,
        work_id: safeRef(row.work_id),
        actor: safeRef(row.actor),
        target: safeRef(row.target),
        source_surface: safeText(row.source_surface, 120),
        authority_level: safeText(row.authority_level, 120),
        state_keys: safeJsonStringArray(row.state_keys),
        causal_parent_id: safeRef(row.causal_parent_id),
        payload_ref: safeRef(row.payload_ref),
        result_status: safeText(row.result_status, 80),
        created_at: safeText(row.created_at, 80),
      };
    })
    .filter(isPresent);
}

function collectActionRecords(
  db: ReadonlySqliteDatabase,
  scope: string,
  gaps: AugnesDeltaProjectionGap[],
): AugnesDeltaProjectionActionRecordInput[] {
  const rows = selectProjectionRows<ActionRecordRow>({
    db,
    table: "action_records",
    sourceKind: "action_record",
    gapCode: "action_records_unavailable",
    scope,
    gaps,
    sql: `
      SELECT
        id,
        scope,
        state_key,
        title,
        description,
        status,
        source_agent_id,
        source_session_id,
        created_at,
        completed_at
      FROM action_records
      WHERE scope = ?
      ORDER BY created_at DESC, id ASC
      LIMIT ?
    `,
  });

  return rows
    .map((row) => {
      const id = safeRef(row.id);
      if (!id) return null;

      return {
        id,
        scope: safeRef(row.scope) ?? scope,
        state_key: safeText(row.state_key, 160),
        title: safeText(row.title, 180),
        description: safeText(
          row.description,
          360,
          "Projected action record description omitted by public-safety filter.",
        ),
        status: safeText(row.status, 80),
        source_agent_id: safeRef(row.source_agent_id),
        source_session_id: safeRef(row.source_session_id),
        created_at: safeText(row.created_at, 80),
        completed_at: safeText(row.completed_at, 80),
      };
    })
    .filter(isPresent);
}

function collectEvidenceRecords(
  db: ReadonlySqliteDatabase,
  scope: string,
  gaps: AugnesDeltaProjectionGap[],
): AugnesDeltaProjectionEvidenceRecordInput[] {
  const rows = selectProjectionRows<EvidenceRecordRow>({
    db,
    table: "verification_evidence_records",
    sourceKind: "evidence_record",
    gapCode: "evidence_records_unavailable",
    scope,
    gaps,
    sql: `
      SELECT
        evidence_id,
        scope,
        work_id,
        publication_id,
        delivery_id,
        target_surface,
        target_ref,
        evidence_kind,
        label,
        status,
        result_summary,
        skipped_reason,
        observed_behavior,
        source_surface,
        source_ref,
        related_action_id,
        related_work_event_id,
        created_by,
        created_at
      FROM verification_evidence_records
      WHERE scope = ?
      ORDER BY created_at DESC, evidence_id ASC
      LIMIT ?
    `,
  });

  return rows
    .map((row) => {
      const evidenceId = safeRef(row.evidence_id);
      if (!evidenceId) return null;

      return {
        evidence_id: evidenceId,
        scope: safeRef(row.scope) ?? scope,
        work_id: safeRef(row.work_id),
        publication_id: safeRef(row.publication_id),
        delivery_id: safeRef(row.delivery_id),
        target_surface: safeText(row.target_surface, 120),
        target_ref: safeRef(row.target_ref),
        evidence_kind: safeText(row.evidence_kind, 80),
        label: safeText(row.label, 180),
        status: safeText(row.status, 80),
        command: null,
        result_summary: safeText(
          row.result_summary,
          360,
          "Projected evidence record summary omitted by public-safety filter.",
        ),
        skipped_reason: safeText(row.skipped_reason, 240),
        observed_behavior: safeText(row.observed_behavior, 360),
        source_surface: safeText(row.source_surface, 120),
        source_ref: safeRef(row.source_ref),
        related_action_id: safeRef(row.related_action_id),
        related_work_event_id: safeRef(row.related_work_event_id),
        created_by: safeRef(row.created_by),
        created_at: safeText(row.created_at, 80),
      };
    })
    .filter(isPresent);
}

function collectDogfoodingRecords(
  db: ReadonlySqliteDatabase,
  scope: string,
  gaps: AugnesDeltaProjectionGap[],
): AugnesDeltaProjectionDogfoodingRecordInput[] {
  if (!tableExists(db, "dogfooding_records")) {
    gaps.push(
      collectorGap({
        code: "dogfooding_records_table_unavailable",
        severity: "low",
        source_kind: "dogfooding_record",
        summary:
          "No structured dogfooding record table is available to the read-only projection collector.",
        details: ["Dogfooding records remain optional and gap-reported."],
      }),
    );
    return [];
  }

  const rows = selectProjectionRows<DogfoodingRecordRow>({
    db,
    table: "dogfooding_records",
    sourceKind: "dogfooding_record",
    gapCode: "dogfooding_records_unavailable",
    scope,
    gaps,
    sql: `
      SELECT
        record_id,
        scope,
        status,
        operator_actor_ref,
        recorded_at,
        bounded_context_summary,
        public_safe
      FROM dogfooding_records
      WHERE scope = ?
        AND public_safe = 1
        AND status NOT LIKE 'blocked_%'
      ORDER BY recorded_at DESC, record_id ASC
      LIMIT ?
    `,
  });
  const signalRefsByRecordId = tableExists(db, "dogfooding_signals")
    ? collectDogfoodingSignalRefs(db, rows)
    : new Map<string, string[]>();

  return rows
    .map((row) => {
      const recordId = safeRef(row.record_id);
      if (!recordId || row.public_safe !== 1) return null;

      return {
        record_id: recordId,
        scope: safeRef(row.scope) ?? scope,
        record_kind: "dogfooding_record",
        title: `Dogfooding record ${recordId}`,
        summary: safeText(
          row.bounded_context_summary,
          360,
          "Projected dogfooding bounded summary omitted by public-safety filter.",
        ),
        status: safeText(row.status, 80),
        created_at: safeText(row.recorded_at, 80),
        created_by: safeRef(row.operator_actor_ref),
        signal_refs: signalRefsByRecordId.get(recordId) ?? [],
      };
    })
    .filter(isPresent);
}

function collectDogfoodingSignalRefs(
  db: ReadonlySqliteDatabase,
  rows: DogfoodingRecordRow[],
): Map<string, string[]> {
  const safeRecordIds = rows
    .map((row) => safeRef(row.record_id))
    .filter(isPresent);

  if (safeRecordIds.length === 0) {
    return new Map();
  }

  const placeholders = safeRecordIds.map(() => "?").join(", ");
  const signalRows = db
    .prepare(
      `
        SELECT record_id, signal_id
        FROM dogfooding_signals
        WHERE public_safe = 1
          AND record_id IN (${placeholders})
        ORDER BY record_id ASC, signal_id ASC
      `,
    )
    .all(...safeRecordIds) as DogfoodingSignalRow[];
  const byRecordId = new Map<string, string[]>();

  for (const row of signalRows) {
    const recordId = safeRef(row.record_id);
    const signalId = safeRef(row.signal_id);
    if (!recordId || !signalId) continue;
    const existing = byRecordId.get(recordId) ?? [];
    existing.push(signalId);
    byRecordId.set(recordId, existing);
  }

  return byRecordId;
}

function collectHandoffTraces(
  coordinationEvents: AugnesDeltaProjectionCoordinationEventInput[],
): AugnesDeltaProjectionHandoffTraceInput[] {
  const handoffTraces = new Map<string, AugnesDeltaProjectionHandoffTraceInput>();

  for (const event of coordinationEvents) {
    if (!isHandoffEvent(event.event_type)) continue;
    const handoffRef = safeRef(event.payload_ref) ?? safeRef(event.event_id);
    if (!handoffRef) continue;
    handoffTraces.set(handoffRef, {
      handoff_ref: handoffRef,
      scope: event.scope,
      handoff_kind: event.event_type ?? "operator_packet",
      summary:
        "Pointer to structured handoff coordination event only; packet text is not reconstructed.",
      created_at: event.created_at,
      created_by: event.actor,
    });
  }

  return [...handoffTraces.values()];
}

function collectCodexResultTraces(
  workEvents: AugnesDeltaProjectionWorkEventInput[],
): AugnesDeltaProjectionCodexResultTraceInput[] {
  const codexResults = new Map<string, AugnesDeltaProjectionCodexResultTraceInput>();

  for (const event of workEvents) {
    if (safeRef(event.actor) !== "codex") continue;
    if (!event.result_kind && !event.related_pr && !event.related_action_id) continue;

    const resultRef = safeRef(event.id);
    if (!resultRef) continue;
    codexResults.set(resultRef, {
      result_ref: resultRef,
      scope: event.scope,
      result_kind: event.result_kind,
      summary:
        "Pointer to structured Codex work-event result metadata only; result text is not reconstructed.",
      status: event.result_status,
      created_at: event.created_at,
      created_by: event.actor,
      artifact_refs: [],
      evidence_refs: [],
      handoff_refs: [],
    });
  }

  return [...codexResults.values()];
}

function buildRuntimeSnapshotRef({
  asOf,
  stateDeltaProposals,
  workEvents,
  coordinationEvents,
  actionRecords,
  evidenceRecords,
  dogfoodingRecords,
  handoffTraces,
  codexResultTraces,
}: {
  asOf: string;
  stateDeltaProposals: AugnesDeltaProjectionStateDeltaProposalInput[];
  workEvents: AugnesDeltaProjectionWorkEventInput[];
  coordinationEvents: AugnesDeltaProjectionCoordinationEventInput[];
  actionRecords: AugnesDeltaProjectionActionRecordInput[];
  evidenceRecords: AugnesDeltaProjectionEvidenceRecordInput[];
  dogfoodingRecords: AugnesDeltaProjectionDogfoodingRecordInput[];
  handoffTraces: AugnesDeltaProjectionHandoffTraceInput[];
  codexResultTraces: AugnesDeltaProjectionCodexResultTraceInput[];
}): SnapshotRef {
  const sourceRefs = [
    ...stateDeltaProposals.map((source) => `state_delta_proposal:${source.id}`),
    ...workEvents.map((source) => `work_event:${source.id}`),
    ...coordinationEvents.map(
      (source) => `coordination_event:${source.event_id}`,
    ),
    ...actionRecords.map((source) => `action_record:${source.id}`),
    ...evidenceRecords.map((source) => `evidence_record:${source.evidence_id}`),
    ...dogfoodingRecords.map(
      (source) => `dogfooding_record:${source.record_id}`,
    ),
    ...handoffTraces.map((source) => `handoff:${source.handoff_ref}`),
    ...codexResultTraces.map((source) => `codex_result:${source.result_ref}`),
  ];

  return {
    snapshot_id: "runtime_read_context.augnes_delta_projection.v0.1",
    snapshot_kind: "readonly_runtime_db_projection_context",
    created_at: asOf,
    source_refs: uniqueSorted(sourceRefs),
    staleness_status: "fresh",
    freshness_notes: [
      "Built in memory during the GET request from an existing read-only DB connection.",
      "Not persisted and not a durable PerspectiveSnapshot record.",
      "Source records remain authoritative.",
    ],
  };
}

function buildRuntimeDiagnosticRefs(
  gaps: AugnesDeltaProjectionGap[],
): ResearchDiagnosticRef[] {
  if (gaps.length === 0) {
    return [];
  }

  return [
    {
      diagnostic_id:
        "diagnostic.augnes_delta_projection.runtime_source_collection.v0.1",
      diagnostic_kind: "runtime_source_collection_gap_summary",
      source_ref: "app/api/augnes/read/deltas",
      summary:
        "Runtime source collection reported projection gaps; diagnostic is log-only and non-authoritative.",
      status: "log_only",
      non_authority_notes: [
        "not truth",
        "not proof",
        "not approval",
        "not readiness",
        "not committed Perspective state",
      ],
      informs_delta_ids: [],
    },
  ];
}

function selectProjectionRows<T>({
  db,
  table,
  sourceKind,
  gapCode,
  scope,
  gaps,
  sql,
}: {
  db: ReadonlySqliteDatabase;
  table: string;
  sourceKind: AugnesDeltaProjectionSourceKind;
  gapCode: string;
  scope: string;
  gaps: AugnesDeltaProjectionGap[];
  sql: string;
}): T[] {
  if (!tableExists(db, table)) {
    gaps.push(
      collectorGap({
        code: `${table}_table_unavailable`,
        severity: sourceKind === "dogfooding_record" ? "low" : "medium",
        source_kind: sourceKind,
        summary: `No ${table} table is available to the read-only projection collector.`,
        details: ["The missing source family is gap-reported; no schema was created."],
      }),
    );
    return [];
  }

  try {
    return db.prepare(sql).all(scope, SOURCE_LIMIT) as T[];
  } catch {
    gaps.push(
      collectorGap({
        code: gapCode,
        severity: sourceKind === "dogfooding_record" ? "low" : "medium",
        source_kind: sourceKind,
        summary: `The read-only projection collector could not read ${table}.`,
        details: [
          "Raw DB error details are omitted from the public-safe projection response.",
          "No write, migration, or source mutation was attempted.",
        ],
      }),
    );
    return [];
  }
}

function tableExists(db: ReadonlySqliteDatabase, table: string): boolean {
  const row = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(table);

  return Boolean(row);
}

function collectorGap({
  code,
  severity,
  source_kind,
  summary,
  details = [],
  source_refs = [],
}: {
  code: string;
  severity: AugnesDeltaProjectionGapSeverity;
  source_kind: AugnesDeltaProjectionSourceKind;
  summary: string;
  details?: string[];
  source_refs?: string[];
}): AugnesDeltaProjectionGap {
  return createProjectionGap({
    code,
    severity,
    source_kind,
    summary,
    details: [
      ...details,
      "Phase 2B source collection is read-only and pointer-only.",
    ],
    source_refs,
  });
}

function readRouteError(
  code: AugnesDeltaProjectionReadErrorCode,
  status: AugnesDeltaProjectionReadErrorStatus,
): AugnesDeltaProjectionReadValidationResult {
  return {
    ok: false,
    code,
    status,
    authority_boundary: ERROR_AUTHORITY_BOUNDARY,
  };
}

function isHandoffEvent(eventType: string | null | undefined): boolean {
  return [
    "handoff_created",
    "handoff_ready",
    "handoff_delivered",
    "handoff_acknowledged",
  ].includes(eventType ?? "");
}

function safeJsonStringArray(value: string | string[] | null | undefined): string[] {
  if (Array.isArray(value)) {
    return value.map(safeRef).filter(isPresent);
  }

  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(safeRef).filter(isPresent) : [];
  } catch {
    return [];
  }
}

function safeRef(value: string | null | undefined): string | null {
  return safeText(value, 180);
}

function safeText(
  value: string | null | undefined,
  maxLength: number,
  fallback: string | null = null,
): string | null {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  if (!trimmed || containsPrivateMarker(trimmed)) {
    return fallback;
  }

  return trimmed.length > maxLength
    ? `${trimmed.slice(0, Math.max(0, maxLength - 3))}...`
    : trimmed;
}

function containsPrivateMarker(value: string): boolean {
  const normalized = value.toLowerCase();
  return PRIVATE_MARKERS.some((marker) =>
    normalized.includes(marker.toLowerCase()),
  );
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
