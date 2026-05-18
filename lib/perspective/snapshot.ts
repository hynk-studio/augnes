import {
  listActionRecords,
  listOpenTensions,
  listStateDeltaProposals,
  listStateEntries,
  type ActionRecord,
  type StateDeltaProposal,
  type StateEntry,
  type StateTension,
  type StateValue,
} from "@/lib/db";
import {
  listExecutionLanes,
  type ExecutionLane,
  type ExecutionLaneAuthority,
  type ExecutionLaneId,
  type ExecutionLaneRole,
} from "@/lib/execution-lanes";
import {
  listEvidenceRecords,
  type EvidenceRecord,
} from "@/lib/evidence-records";
import { buildStateBrief } from "@/lib/state/brief";
import {
  listWorkEvents,
  listWorkItems,
  normalizeScope,
  type WorkEvent,
  type WorkItem,
} from "@/lib/work";

const STATE_ENTRY_LIMIT = 16;
const PROPOSAL_LIMIT = 12;
const EVIDENCE_LIMIT = 12;
const WORK_LIMIT = 8;
const WORK_EVENT_LIMIT = 4;
const ACTION_LIMIT = 12;
const TENSION_LIMIT = 12;
const RECENT_AGENT_ACTIVITY_LIMIT = 16;

type StateBasisItem = {
  id: string;
  state_key: string;
  value: StateValue;
  temporal_scope: string;
  stability: string;
  change_type: string;
  source_agent_id: string | null;
  source_session_id: string | null;
  updated_at: string;
};

type ProposalPressureItem = {
  id: string;
  state_key: string;
  operation: string;
  stability: string;
  change_type: string;
  reason: string | null;
  proposed_at: string;
  scores: {
    prediction_error: number;
    salience: number;
    evidence: number;
    conflict: number;
    self_impact: number;
  };
  consolidation_status: string;
};

type EvidenceBasisItem = {
  evidence_id: string;
  work_id: string | null;
  publication_id: string | null;
  delivery_id: string | null;
  evidence_kind: string;
  status: string;
  label: string;
  source_surface: string;
  source_ref: string | null;
  result_summary: string;
  created_at: string;
};

type WorkTraceItem = {
  work_id: string;
  title: string;
  status: string;
  priority: string;
  summary: string;
  next_action: string;
  user_attention_required: boolean;
  related_state_keys: string[];
  recent_events: WorkEventBasisItem[];
  updated_at: string;
};

type WorkEventBasisItem = {
  id: string;
  actor: string;
  event_type: string;
  summary: string;
  result_status: string | null;
  result_kind: string | null;
  related_action_id: string | null;
  related_pr: string | null;
  related_state_keys: string[];
  created_at: string;
};

type ActionTraceItem = {
  id: string;
  state_key: string | null;
  title: string;
  status: string;
  source_agent_id: string | null;
  source_session_id: string | null;
  created_at: string;
  completed_at: string | null;
};

type TensionItem = {
  id: string;
  state_key: string | null;
  title: string;
  description: string;
  severity: string;
  source_agent_id: string | null;
  source_session_id: string | null;
  created_at: string;
};

type RecentAgentActivityItem = {
  ref_type: "action_record" | "work_event" | "evidence_record";
  ref_id: string;
  actor_or_surface: string;
  summary: string;
  status: string | null;
  created_at: string;
};

type SnapshotLaneBoundary = {
  id: ExecutionLaneId;
  role: ExecutionLaneRole;
  label: string;
  authority: ExecutionLaneAuthority;
  derived_view_compatible: boolean;
  notes: readonly string[];
};

export type PerspectiveSnapshot = {
  runtime: "augnes";
  snapshot_version: "perspective_snapshot.v0.1";
  scope: string;
  as_of: string;
  source_refs: {
    state_brief_as_of: string;
    state_entry_ids: string[];
    pending_proposal_ids: string[];
    evidence_ids: string[];
    work_ids: string[];
    work_event_ids: string[];
    action_record_ids: string[];
    tension_ids: string[];
    execution_lane_ids: ExecutionLaneId[];
  };
  committed_state_basis: {
    summary: string;
    active: StateBasisItem[];
    future: StateBasisItem[];
    completed: StateBasisItem[];
    deprecated: StateBasisItem[];
  };
  pending_proposal_pressure: {
    count: number;
    pressure_level: "none" | "low" | "medium" | "high";
    proposals: ProposalPressureItem[];
    summary_reason: string;
  };
  evidence_basis: {
    count: number;
    recent: EvidenceBasisItem[];
    summary_reason: string;
  };
  work_trace_basis: {
    count: number;
    active: WorkTraceItem[];
    summary_reason: string;
  };
  action_trace_basis: {
    count: number;
    recent: ActionTraceItem[];
    summary_reason: string;
  };
  open_tensions: {
    count: number;
    items: TensionItem[];
  };
  recent_agent_activity: RecentAgentActivityItem[];
  current_frame: {
    summary: string;
    primary_state_keys: string[];
    active_work_ids: string[];
    pressure_level: "none" | "low" | "medium" | "high";
  };
  boundary_next: {
    title: string;
    rationale: string;
    suggested_actor: string;
    priority: string;
    related_state_keys: string[];
    allowed_next_steps: string[];
    forbidden_next_steps: string[];
  };
  missing_context: string[];
  authority_boundaries: {
    derived_view_only: true;
    source_of_truth: false;
    can_commit_or_reject_state: false;
    can_record_proof: false;
    can_create_evidence: false;
    can_update_work: false;
    can_publish_external: false;
    can_retry: false;
    can_mutate_mailbox: false;
    can_mutate_publication_state: false;
    can_call_github_or_openai: false;
    can_write_temporal_review_artifacts: false;
    lanes: SnapshotLaneBoundary[];
    boundaries: string[];
  };
  research_diagnostics: {
    mode: "log_only";
    sidecar_e_t: null;
    meta_wm_hint: null;
    bsl_hint: null;
    loopness_hint: null;
    comp_index_hint: null;
    notes: string[];
  };
};

export function buildPerspectiveSnapshot({
  scope,
}: {
  scope?: string | null;
} = {}): PerspectiveSnapshot {
  const normalizedScope = normalizeScope(scope);
  const asOf = new Date().toISOString();
  const stateBrief = buildStateBrief(normalizedScope);
  const stateEntries = listStateEntries(normalizedScope);
  const pendingProposals = listStateDeltaProposals({
    scope: normalizedScope,
    status: "pending",
  });
  const evidenceRecords = listEvidenceRecords({
    scope: normalizedScope,
    limit: EVIDENCE_LIMIT,
  });
  const workItems = listWorkItems(normalizedScope).slice(0, WORK_LIMIT);
  const workEventsByWorkId = new Map(
    workItems.map((work) => [
      work.work_id,
      listWorkEvents({
        workId: work.work_id,
        scope: normalizedScope,
        limit: WORK_EVENT_LIMIT,
      }),
    ]),
  );
  const actionRecords = listActionRecords(normalizedScope).slice(0, ACTION_LIMIT);
  const openTensions = listOpenTensions(normalizedScope).slice(0, TENSION_LIMIT);
  const lanes = listExecutionLanes();
  const groupedState = groupStateEntries(stateEntries);
  const pressureLevel = getPressureLevel(pendingProposals.length);
  const workTraceItems = workItems.map((work) =>
    mapWorkTraceItem(work, workEventsByWorkId.get(work.work_id) ?? []),
  );
  const allWorkEvents = Array.from(workEventsByWorkId.values()).flat();
  const actionTraceItems = actionRecords.map(mapActionTraceItem);
  const evidenceItems = evidenceRecords.map(mapEvidenceBasisItem);
  const tensionItems = openTensions.map(mapTensionItem);

  return {
    runtime: "augnes",
    snapshot_version: "perspective_snapshot.v0.1",
    scope: normalizedScope,
    as_of: asOf,
    source_refs: {
      state_brief_as_of: stateBrief.as_of,
      state_entry_ids: stateEntries.map((entry) => entry.id),
      pending_proposal_ids: pendingProposals.map((proposal) => proposal.id),
      evidence_ids: evidenceRecords.map((record) => record.evidence_id),
      work_ids: workItems.map((work) => work.work_id),
      work_event_ids: allWorkEvents.map((event) => event.id),
      action_record_ids: actionRecords.map((action) => action.id),
      tension_ids: openTensions.map((tension) => tension.id),
      execution_lane_ids: lanes.map((lane) => lane.id),
    },
    committed_state_basis: {
      summary: stateBrief.agent_handoff.current_status.summary,
      active: groupedState.active.slice(0, STATE_ENTRY_LIMIT).map(mapStateBasisItem),
      future: groupedState.future.slice(0, STATE_ENTRY_LIMIT).map(mapStateBasisItem),
      completed: groupedState.completed
        .slice(0, STATE_ENTRY_LIMIT)
        .map(mapStateBasisItem),
      deprecated: groupedState.deprecated
        .slice(0, STATE_ENTRY_LIMIT)
        .map(mapStateBasisItem),
    },
    pending_proposal_pressure: {
      count: pendingProposals.length,
      pressure_level: pressureLevel,
      proposals: pendingProposals.slice(0, PROPOSAL_LIMIT).map(mapProposalPressureItem),
      summary_reason:
        pendingProposals.length > 0
          ? "Pending proposals are pressure only; they require explicit Core commit/reject before durable state changes."
          : "No pending proposals were found for this scope.",
    },
    evidence_basis: {
      count: evidenceRecords.length,
      recent: evidenceItems,
      summary_reason:
        evidenceRecords.length > 0
          ? "Recent verification evidence records are included as trace context only."
          : "No verification evidence records were found for this scope.",
    },
    work_trace_basis: {
      count: workItems.length,
      active: workTraceItems,
      summary_reason:
        workItems.length > 0
          ? "Work trace is included as coordination context, not state authority."
          : "No work items were found for this scope.",
    },
    action_trace_basis: {
      count: actionRecords.length,
      recent: actionTraceItems,
      summary_reason:
        actionRecords.length > 0
          ? "Action records are included as execution trace context only."
          : "No action records were found for this scope.",
    },
    open_tensions: {
      count: openTensions.length,
      items: tensionItems,
    },
    recent_agent_activity: buildRecentAgentActivity({
      actionRecords,
      workEvents: allWorkEvents,
      evidenceRecords,
    }),
    current_frame: {
      summary: buildCurrentFrameSummary({
        stateBriefSummary: stateBrief.agent_handoff.current_status.summary,
        pendingProposalCount: pendingProposals.length,
        openTensionCount: openTensions.length,
        workItemCount: workItems.length,
      }),
      primary_state_keys: collectPrimaryStateKeys({
        stateEntries,
        pendingProposals,
        openTensions,
      }),
      active_work_ids: workItems
        .filter((work) => !["completed", "archived"].includes(work.status))
        .map((work) => work.work_id),
      pressure_level: pressureLevel,
    },
    boundary_next: {
      title: stateBrief.agent_handoff.next_recommended_action.title,
      rationale: stateBrief.agent_handoff.next_recommended_action.rationale,
      suggested_actor: stateBrief.agent_handoff.next_recommended_action.suggested_actor,
      priority: stateBrief.agent_handoff.next_recommended_action.priority,
      related_state_keys:
        stateBrief.agent_handoff.next_recommended_action.related_state_keys,
      allowed_next_steps: [
        "Use this snapshot for read-only perspective framing.",
        "Follow source refs back to Augnes Core records before taking action.",
        "Route any future write, proof, publish, retry, or commit/reject behavior through separately scoped Core-gated paths.",
      ],
      forbidden_next_steps: [
        "Do not treat PerspectiveSnapshot as source of truth.",
        "Do not approve, publish, retry, commit/reject, record proof, create evidence, update work, mutate mailbox, mutate publication state, or call GitHub/OpenAI from this view.",
        "Do not write temporal preview review artifacts from snapshot generation.",
      ],
    },
    missing_context: buildMissingContext({
      stateEntries,
      pendingProposals,
      evidenceRecords,
      workItems,
      actionRecords,
      openTensions,
    }),
    authority_boundaries: buildAuthorityBoundaries(lanes),
    research_diagnostics: {
      mode: "log_only",
      sidecar_e_t: null,
      meta_wm_hint: null,
      bsl_hint: null,
      loopness_hint: null,
      comp_index_hint: null,
      notes: [
        "Research diagnostic slots are placeholders for future gated PRs.",
        "These fields are not authority, readiness, proof, or source of truth.",
        "Snapshot generation does not compute brain-inspired diagnostics or use them to mutate Core state.",
      ],
    },
  };
}

function groupStateEntries(entries: StateEntry[]) {
  return {
    active: entries.filter((entry) => entry.stability === "active" || entry.stability === "stable"),
    future: entries.filter(
      (entry) =>
        entry.temporal_scope === "future_phase" ||
        entry.change_type === "future_intent",
    ),
    completed: entries.filter((entry) => entry.stability === "completed"),
    deprecated: entries.filter((entry) => entry.stability === "deprecated"),
  };
}

function mapStateBasisItem(entry: StateEntry): StateBasisItem {
  return {
    id: entry.id,
    state_key: entry.state_key,
    value: entry.value,
    temporal_scope: entry.temporal_scope,
    stability: entry.stability,
    change_type: entry.change_type,
    source_agent_id: entry.source_agent_id,
    source_session_id: entry.source_session_id,
    updated_at: entry.updated_at,
  };
}

function mapProposalPressureItem(
  proposal: StateDeltaProposal,
): ProposalPressureItem {
  return {
    id: proposal.id,
    state_key: proposal.state_key,
    operation: proposal.operation,
    stability: proposal.stability,
    change_type: proposal.change_type,
    reason: proposal.reason,
    proposed_at: proposal.proposed_at,
    scores: {
      prediction_error: proposal.prediction_error_score,
      salience: proposal.salience_score,
      evidence: proposal.evidence_score,
      conflict: proposal.conflict_score,
      self_impact: proposal.self_impact_score,
    },
    consolidation_status: proposal.consolidation_status,
  };
}

function mapEvidenceBasisItem(record: EvidenceRecord): EvidenceBasisItem {
  return {
    evidence_id: record.evidence_id,
    work_id: record.work_id,
    publication_id: record.publication_id,
    delivery_id: record.delivery_id,
    evidence_kind: record.evidence_kind,
    status: record.status,
    label: record.label,
    source_surface: record.source_surface,
    source_ref: record.source_ref,
    result_summary: record.result_summary,
    created_at: record.created_at,
  };
}

function mapWorkTraceItem(work: WorkItem, events: WorkEvent[]): WorkTraceItem {
  return {
    work_id: work.work_id,
    title: work.title,
    status: work.status,
    priority: work.priority,
    summary: work.summary,
    next_action: work.next_action,
    user_attention_required: work.user_attention_required,
    related_state_keys: work.related_state_keys,
    recent_events: events.map(mapWorkEventBasisItem),
    updated_at: work.updated_at,
  };
}

function mapWorkEventBasisItem(event: WorkEvent): WorkEventBasisItem {
  return {
    id: event.id,
    actor: event.actor,
    event_type: event.event_type,
    summary: event.summary,
    result_status: event.result_status,
    result_kind: event.result_kind,
    related_action_id: event.related_action_id,
    related_pr: event.related_pr,
    related_state_keys: event.related_state_keys,
    created_at: event.created_at,
  };
}

function mapActionTraceItem(action: ActionRecord): ActionTraceItem {
  return {
    id: action.id,
    state_key: action.state_key,
    title: action.title,
    status: action.status,
    source_agent_id: action.source_agent_id,
    source_session_id: action.source_session_id,
    created_at: action.created_at,
    completed_at: action.completed_at,
  };
}

function mapTensionItem(tension: StateTension): TensionItem {
  return {
    id: tension.id,
    state_key: tension.state_key,
    title: tension.title,
    description: tension.description,
    severity: tension.severity,
    source_agent_id: tension.source_agent_id,
    source_session_id: tension.source_session_id,
    created_at: tension.created_at,
  };
}

function buildRecentAgentActivity({
  actionRecords,
  workEvents,
  evidenceRecords,
}: {
  actionRecords: ActionRecord[];
  workEvents: WorkEvent[];
  evidenceRecords: EvidenceRecord[];
}) {
  const activity: RecentAgentActivityItem[] = [
    ...actionRecords.map((action) => ({
      ref_type: "action_record" as const,
      ref_id: action.id,
      actor_or_surface: action.source_agent_id ?? "unknown",
      summary: action.title,
      status: action.status,
      created_at: action.created_at,
    })),
    ...workEvents.map((event) => ({
      ref_type: "work_event" as const,
      ref_id: event.id,
      actor_or_surface: event.actor,
      summary: event.summary,
      status: event.result_status,
      created_at: event.created_at,
    })),
    ...evidenceRecords.map((record) => ({
      ref_type: "evidence_record" as const,
      ref_id: record.evidence_id,
      actor_or_surface: record.source_surface,
      summary: record.label,
      status: record.status,
      created_at: record.created_at,
    })),
  ];

  return activity
    .sort((first, second) => compareIsoDesc(first.created_at, second.created_at))
    .slice(0, RECENT_AGENT_ACTIVITY_LIMIT);
}

function buildCurrentFrameSummary({
  stateBriefSummary,
  pendingProposalCount,
  openTensionCount,
  workItemCount,
}: {
  stateBriefSummary: string;
  pendingProposalCount: number;
  openTensionCount: number;
  workItemCount: number;
}) {
  return [
    stateBriefSummary,
    `${pendingProposalCount} pending proposal(s), ${openTensionCount} open tension(s), and ${workItemCount} work item(s) are included as bounded Perspective context.`,
    "This frame is derived from Augnes Core reads and has no write authority.",
  ].join(" ");
}

function collectPrimaryStateKeys({
  stateEntries,
  pendingProposals,
  openTensions,
}: {
  stateEntries: StateEntry[];
  pendingProposals: StateDeltaProposal[];
  openTensions: StateTension[];
}) {
  return uniqueStrings([
    ...stateEntries.slice(0, STATE_ENTRY_LIMIT).map((entry) => entry.state_key),
    ...pendingProposals.slice(0, PROPOSAL_LIMIT).map((proposal) => proposal.state_key),
    ...openTensions
      .slice(0, TENSION_LIMIT)
      .map((tension) => tension.state_key)
      .filter((stateKey): stateKey is string => Boolean(stateKey)),
  ]);
}

function buildMissingContext({
  stateEntries,
  pendingProposals,
  evidenceRecords,
  workItems,
  actionRecords,
  openTensions,
}: {
  stateEntries: StateEntry[];
  pendingProposals: StateDeltaProposal[];
  evidenceRecords: EvidenceRecord[];
  workItems: WorkItem[];
  actionRecords: ActionRecord[];
  openTensions: StateTension[];
}) {
  const missing = [];

  if (stateEntries.length === 0) {
    missing.push("No committed state entries were found for this scope.");
  }
  if (pendingProposals.length === 0) {
    missing.push("No pending proposal pressure was found for this scope.");
  }
  if (evidenceRecords.length === 0) {
    missing.push("No verification evidence records were found for this scope.");
  }
  if (workItems.length === 0) {
    missing.push("No work trace records were found for this scope.");
  }
  if (actionRecords.length === 0) {
    missing.push("No action trace records were found for this scope.");
  }
  if (openTensions.length === 0) {
    missing.push("No open tensions were found for this scope.");
  }

  return missing;
}

function buildAuthorityBoundaries(lanes: ExecutionLane[]) {
  return {
    derived_view_only: true as const,
    source_of_truth: false as const,
    can_commit_or_reject_state: false as const,
    can_record_proof: false as const,
    can_create_evidence: false as const,
    can_update_work: false as const,
    can_publish_external: false as const,
    can_retry: false as const,
    can_mutate_mailbox: false as const,
    can_mutate_publication_state: false as const,
    can_call_github_or_openai: false as const,
    can_write_temporal_review_artifacts: false as const,
    lanes: lanes.map((lane) => ({
      id: lane.id,
      role: lane.role,
      label: lane.label,
      authority: lane.authority,
      derived_view_compatible:
        lane.authority.derived_view_only ||
        (!lane.authority.can_commit_or_reject_state &&
          !lane.authority.creates_durable_core_records &&
          !lane.authority.can_publish_external),
      notes: lane.authority_notes,
    })),
    boundaries: [
      "PerspectiveSnapshot is a derived read model only.",
      "Augnes Core remains the source of truth for committed state and commit/reject behavior.",
      "Snapshot generation does not approve, publish, retry, commit/reject, record proof, create evidence, update work, mutate mailbox, mutate publication state, call GitHub/OpenAI, or write temporal review artifacts.",
      "Provider names are examples; lane semantics are provider-neutral.",
    ],
  };
}

function getPressureLevel(count: number): "none" | "low" | "medium" | "high" {
  if (count === 0) {
    return "none";
  }
  if (count <= 2) {
    return "low";
  }
  if (count <= 5) {
    return "medium";
  }
  return "high";
}

function compareIsoDesc(first: string, second: string) {
  const firstTime = new Date(first).getTime();
  const secondTime = new Date(second).getTime();
  if (Number.isFinite(firstTime) && Number.isFinite(secondTime)) {
    return secondTime - firstTime;
  }
  return second.localeCompare(first);
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values));
}
