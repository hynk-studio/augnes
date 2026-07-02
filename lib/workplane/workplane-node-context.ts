import { readWorkplaneContext } from "@/lib/workplane/read-workplane-context";
import type {
  AgentWorkplaneAuthorityBoundary,
  AgentWorkplaneFallbackStatus,
  AgentWorkplaneNodeContext,
  AgentWorkplaneNodeContextRead,
  AgentWorkplaneNodeKind,
  AgentWorkplaneNodeStatus,
  AgentWorkplanePanelContext,
  AgentWorkplanePanelId,
  AgentWorkplaneStaleness,
  AgentWorkplaneValidationSummary,
} from "@/types/agent-workplane-node";
import {
  AGENT_WORKPLANE_NODE_CONTRACT_VERSION,
  AGENT_WORKPLANE_NODE_KINDS,
  AGENT_WORKPLANE_NODE_STATUSES,
  AGENT_WORKPLANE_PANEL_IDS,
} from "@/types/agent-workplane-node";
import type { WorkplaneContextRead } from "./read-workplane-context";

export const AGENT_WORKPLANE_REQUIRED_PANEL_IDS = [
  "work_queue",
  "current_perspective",
  "delta_projection",
  "review_queue",
  "evidence_handoff",
  "workplane_inspector",
  "projection_candidates",
  "delta_batch",
  "handoff_builder_preview",
  "run_postmortem",
  "trace_diagnostics",
  "legacy_cockpit_compatibility",
] as const satisfies readonly AgentWorkplanePanelId[];

export const AGENT_WORKPLANE_ABSORPTION_TARGET_NODE_IDS = [
  "current_objective",
  "handoff_context",
  "perspective_delta",
  "source_ref_bridge",
  "trace_bridge",
  "authority_validation_debug",
  "runner_state",
  "runner_delta_batch",
  "run_postmortem",
  "trace_diagnostics",
] as const satisfies readonly AgentWorkplanePanelId[];

export const AGENT_WORKPLANE_PANEL_REGISTRY: ReadonlyArray<{
  panel_id: AgentWorkplanePanelId;
  node_id: AgentWorkplanePanelId;
  kind: AgentWorkplaneNodeKind;
  status: AgentWorkplaneNodeStatus;
  title: string;
  summary: string;
}> = [
  {
    panel_id: "work_queue",
    node_id: "current_objective",
    kind: "native_panel",
    status: "partial",
    title: "Work Queue",
    summary: "Active goals, active work ids, and next candidate queue hints.",
  },
  {
    panel_id: "current_perspective",
    node_id: "current_perspective",
    kind: "native_panel",
    status: "partial",
    title: "Current Perspective",
    summary: "Current Working Perspective thesis, frame, questions, and staleness.",
  },
  {
    panel_id: "delta_projection",
    node_id: "perspective_delta",
    kind: "native_panel",
    status: "partial",
    title: "Delta Projection",
    summary: "Augnes Delta Projection deltas, batches, gaps, and evidence refs.",
  },
  {
    panel_id: "review_queue",
    node_id: "authority_validation_debug",
    kind: "native_panel",
    status: "partial",
    title: "Review Queue",
    summary: "Operator attention hints and validation-required refs.",
  },
  {
    panel_id: "evidence_handoff",
    node_id: "handoff_context",
    kind: "handoff_context_source",
    status: "partial",
    title: "Evidence / Handoff",
    summary: "Pointer-only evidence, artifact, handoff, and Codex result refs.",
  },
  {
    panel_id: "workplane_inspector",
    node_id: "source_ref_bridge",
    kind: "debug_context_source",
    status: "partial",
    title: "Workplane Inspector",
    summary: "Pointer-only source refs, merge-policy, non-goal, and boundary context.",
  },
  {
    panel_id: "projection_candidates",
    node_id: "perspective_delta",
    kind: "preview_panel",
    status: "preview_only",
    title: "Projection Candidates",
    summary: "Read-only candidate context from Current Perspective and projected deltas.",
  },
  {
    panel_id: "delta_batch",
    node_id: "runner_delta_batch",
    kind: "runner_context_source",
    status: "preview_only",
    title: "Delta Batch",
    summary: "Projected DeltaBatch preview context from Delta Projection read model.",
  },
  {
    panel_id: "handoff_builder_preview",
    node_id: "handoff_context",
    kind: "handoff_context_source",
    status: "preview_only",
    title: "Handoff Builder preview",
    summary: "Pointer-only handoff builder inputs without send or launch authority.",
  },
  {
    panel_id: "run_postmortem",
    node_id: "run_postmortem",
    kind: "runner_context_source",
    status: "not_materialized",
    title: "Run Postmortem",
    summary: "Reserved postmortem slots; no structured run source is materialized.",
  },
  {
    panel_id: "trace_diagnostics",
    node_id: "trace_bridge",
    kind: "trace_context_source",
    status: "partial",
    title: "Trace / Diagnostics",
    summary: "Bounded gaps, diagnostics, validation summaries, and review notes.",
  },
  {
    panel_id: "legacy_cockpit_compatibility",
    node_id: "legacy_cockpit_compatibility",
    kind: "compatibility_panel",
    status: "compatibility_only",
    title: "Legacy Cockpit compatibility",
    summary: "Explicit retained compatibility path for useful legacy Cockpit content.",
  },
  {
    panel_id: "current_objective",
    node_id: "current_objective",
    kind: "debug_context_source",
    status: "partial",
    title: "Current Objective",
    summary: "Absorption target for Work Brief objective context.",
  },
  {
    panel_id: "handoff_context",
    node_id: "handoff_context",
    kind: "handoff_context_source",
    status: "partial",
    title: "Handoff Context",
    summary: "Absorption target for handoff refs and transfer packet context.",
  },
  {
    panel_id: "source_ref_bridge",
    node_id: "source_ref_bridge",
    kind: "debug_context_source",
    status: "partial",
    title: "Source Ref Bridge",
    summary: "Absorption target for source/ref visibility.",
  },
  {
    panel_id: "trace_bridge",
    node_id: "trace_bridge",
    kind: "trace_context_source",
    status: "partial",
    title: "Trace Bridge",
    summary: "Absorption target for bridge and trace context.",
  },
  {
    panel_id: "authority_validation_debug",
    node_id: "authority_validation_debug",
    kind: "debug_context_source",
    status: "partial",
    title: "Authority / Validation / Debug",
    summary: "Absorption target for operator, validation, and debug visibility.",
  },
  {
    panel_id: "runner_state",
    node_id: "runner_state",
    kind: "runner_context_source",
    status: "not_materialized",
    title: "Runner State",
    summary: "Reserved absorption target; runner ledger integration is not materialized.",
  },
] as const;

export const AGENT_WORKPLANE_NODE_CONTEXT_REGISTRY = {
  contract_version: AGENT_WORKPLANE_NODE_CONTRACT_VERSION,
  panel_ids: AGENT_WORKPLANE_PANEL_IDS,
  required_panel_ids: AGENT_WORKPLANE_REQUIRED_PANEL_IDS,
  absorption_target_node_ids: AGENT_WORKPLANE_ABSORPTION_TARGET_NODE_IDS,
  node_kinds: AGENT_WORKPLANE_NODE_KINDS,
  node_statuses: AGENT_WORKPLANE_NODE_STATUSES,
  panels: AGENT_WORKPLANE_PANEL_REGISTRY,
} as const;

const NODE_CONTEXT_SMOKES = [
  "smoke:agent-workplane-node-contract-v0-1",
  "smoke:agent-workplane-shell-v0-1",
  "smoke:agent-workplane-panels-v0-1",
  "smoke:agent-workplane-projection-handoff-v0-1",
] as const;

const DEFAULT_AUTHORITY_BOUNDARY: AgentWorkplaneAuthorityBoundary = {
  surface: "agent_workplane",
  read_only_context: true,
  can_write_db: false,
  can_write_proof_evidence: false,
  can_call_provider_openai: false,
  can_call_github: false,
  can_actuate_github: false,
  can_execute_codex: false,
  can_execute_runner: false,
  can_schedule: false,
  can_apply_durable_memory: false,
  can_apply_perspective: false,
  can_auto_apply_delta: false,
  can_merge_publish_retry_replay_deploy: false,
  notes: [
    "Agent Workplane node context is a read-only context packet.",
    "It adds no DB write, proof/evidence write, provider/OpenAI call, GitHub call or actuation, Codex execution, runner execution, scheduler behavior, durable memory apply, Perspective apply, delta auto-apply, merge, publish, retry, replay, deploy, or external side effect.",
    "Runner State, runner DeltaBatch, and Run Postmortem nodes remain preview-only or not materialized until a separate integration reads the runner ledger.",
  ],
};

export async function readAgentWorkplaneNodeContext():
  Promise<AgentWorkplaneNodeContextRead> {
  const context = await readWorkplaneContext();
  return buildAgentWorkplaneNodeContextRead(context);
}

export function buildAgentWorkplaneNodeContextRead(
  context: WorkplaneContextRead,
): AgentWorkplaneNodeContextRead {
  const current = context.current_perspective_read.data;
  const projection = context.delta_projection_read.data;
  const asOf = chooseLatestTimestamp(current.as_of, projection.as_of);
  const fallbackStatus = buildFallbackStatus(context);
  const staleness = buildStaleness(context, asOf);
  const validationSummary = buildValidationSummary([
    "smoke:agent-workplane-node-contract-v0-1",
    "smoke:agent-workplane-cockpit-inheritance-v0-1",
  ]);
  const sourceRefs = collectWorkplaneSourceRefs(context);
  const panels = AGENT_WORKPLANE_PANEL_REGISTRY.map((entry) =>
    buildPanelContext({
      entry,
      context,
      asOf,
      sourceRefs,
      fallbackStatus,
      staleness,
    }),
  );

  return {
    contract_version: AGENT_WORKPLANE_NODE_CONTRACT_VERSION,
    scope: context.overview.scope,
    as_of: asOf,
    source_refs: sourceRefs,
    authority_boundary: DEFAULT_AUTHORITY_BOUNDARY,
    validation_summary: validationSummary,
    staleness,
    fallback_status: fallbackStatus,
    panels,
    nodes: panels,
    debug_notes: [
      "Built from existing readWorkplaneContext() output only.",
      "No route, runner ledger read, persistence, provider call, GitHub call, Codex execution, durable memory apply, Perspective apply, or runner behavior is added.",
      "Fixture fallback disclosure is preserved through fallback_status and per-node debug_notes.",
    ],
  };
}

function buildPanelContext({
  entry,
  context,
  asOf,
  sourceRefs,
  fallbackStatus,
  staleness,
}: {
  entry: (typeof AGENT_WORKPLANE_PANEL_REGISTRY)[number];
  context: WorkplaneContextRead;
  asOf: string;
  sourceRefs: string[];
  fallbackStatus: AgentWorkplaneFallbackStatus;
  staleness: AgentWorkplaneStaleness;
}): AgentWorkplanePanelContext {
  const panelSourceRefs = sourceRefsForPanel(entry.panel_id, context, sourceRefs);
  const relatedDeltaIds = relatedDeltaIdsForPanel(entry.panel_id, context);
  const relatedBatchIds = relatedBatchIdsForPanel(entry.panel_id, context);
  const relatedHandoffRefs = relatedHandoffRefsForPanel(entry.panel_id, context);
  const relatedEventIds = relatedEventIdsForPanel(entry.panel_id, context);
  const status =
    entry.status === "partial" ? statusForSource(context, staleness) : entry.status;

  return {
    panel_id: entry.panel_id,
    node_id: entry.node_id,
    kind: entry.kind,
    title: entry.title,
    summary: entry.summary,
    status,
    created_at: asOf,
    updated_at: updatedAtForPanel(entry.panel_id, context, asOf),
    source_refs: panelSourceRefs,
    related_run_ids: [],
    related_step_ids: [],
    related_event_ids: relatedEventIds,
    related_batch_ids: relatedBatchIds,
    related_delta_ids: relatedDeltaIds,
    related_handoff_refs: relatedHandoffRefs,
    authority_boundary: DEFAULT_AUTHORITY_BOUNDARY,
    validation_summary: validationForPanel(entry.panel_id),
    staleness: stalenessForPanel(entry.panel_id, context, staleness),
    fallback_status: fallbackForPanel(entry.panel_id, context, fallbackStatus),
    debug_notes: debugNotesForPanel(entry.panel_id, context),
  };
}

function buildValidationSummary(
  smokeRefs: readonly string[],
): AgentWorkplaneValidationSummary {
  return {
    status: "partial",
    smoke_refs: [...smokeRefs],
    notes: [
      "Static smoke coverage verifies contract shape, stable IDs, UI metadata, docs pointers, and no-authority boundaries.",
      "Runtime browser reachability is not required for this read-only contract slice.",
    ],
  };
}

function buildStaleness(
  context: WorkplaneContextRead,
  asOf: string,
): AgentWorkplaneStaleness {
  const current = context.current_perspective_read.data;
  const status = current.staleness.status;

  return {
    status,
    as_of: current.staleness.snapshot_as_of,
    updated_at: asOf,
    notes: [
      ...current.staleness.freshness_notes,
      `Delta Projection as_of ${context.delta_projection_read.data.as_of}.`,
    ],
  };
}

function buildFallbackStatus(
  context: WorkplaneContextRead,
): AgentWorkplaneFallbackStatus {
  const currentStatus = context.source_status.current_perspective;
  const projectionStatus = context.source_status.delta_projection;
  const fallbackReasons = [
    context.fallback_reason.current_perspective,
    context.fallback_reason.delta_projection,
  ].filter(Boolean);

  if (currentStatus === "runtime" && projectionStatus === "runtime") {
    return {
      status: "runtime",
      reason: null,
      source_status: "runtime",
      notes: ["Current Perspective and Delta Projection read from runtime sources."],
    };
  }

  return {
    status:
      currentStatus === "empty_fallback" || projectionStatus === "empty_fallback"
        ? "empty_fallback"
        : "fixture_fallback",
    reason: fallbackReasons.join(" ") || "Fixture fallback disclosure is active.",
    source_status: `${currentStatus}/${projectionStatus}`,
    notes: [
      "Fallback status is explicit and must not be presented as live runtime state.",
    ],
  };
}

function statusForSource(
  context: WorkplaneContextRead,
  staleness: AgentWorkplaneStaleness,
): AgentWorkplaneNodeStatus {
  if (
    context.source_status.current_perspective !== "runtime" ||
    context.source_status.delta_projection !== "runtime"
  ) {
    return "fallback";
  }

  if (staleness.status === "stale") {
    return "stale";
  }

  return "partial";
}

function updatedAtForPanel(
  panelId: AgentWorkplanePanelId,
  context: WorkplaneContextRead,
  fallbackAsOf: string,
) {
  if (
    [
      "work_queue",
      "current_perspective",
      "review_queue",
      "current_objective",
      "authority_validation_debug",
    ].includes(panelId)
  ) {
    return context.current_perspective_read.data.as_of;
  }

  if (panelId === "run_postmortem" || panelId === "runner_state") {
    return fallbackAsOf;
  }

  return context.delta_projection_read.data.as_of;
}

function stalenessForPanel(
  panelId: AgentWorkplanePanelId,
  context: WorkplaneContextRead,
  fallback: AgentWorkplaneStaleness,
): AgentWorkplaneStaleness {
  if (panelId === "run_postmortem" || panelId === "runner_state") {
    return {
      status: "unknown",
      as_of: null,
      updated_at: fallback.updated_at,
      notes: ["Runner/postmortem source is not materialized in this contract slice."],
    };
  }

  if (
    [
      "delta_projection",
      "projection_candidates",
      "delta_batch",
      "runner_delta_batch",
      "handoff_builder_preview",
      "evidence_handoff",
      "handoff_context",
      "perspective_delta",
      "source_ref_bridge",
      "trace_bridge",
      "trace_diagnostics",
    ].includes(panelId)
  ) {
    return {
      status: "unknown",
      as_of: context.delta_projection_read.data.as_of,
      updated_at: context.delta_projection_read.data.as_of,
      notes: ["Delta Projection source staleness is bounded by its as_of timestamp."],
    };
  }

  return fallback;
}

function fallbackForPanel(
  panelId: AgentWorkplanePanelId,
  context: WorkplaneContextRead,
  fallback: AgentWorkplaneFallbackStatus,
): AgentWorkplaneFallbackStatus {
  if (panelId === "run_postmortem" || panelId === "runner_state") {
    return {
      status: "not_materialized",
      reason: "Runner ledger and postmortem source are not read by this helper.",
      source_status: "not_materialized",
      notes: ["No runner DeltaBatch Workplane integration is materialized."],
    };
  }

  if (
    [
      "delta_projection",
      "projection_candidates",
      "delta_batch",
      "runner_delta_batch",
      "handoff_builder_preview",
      "evidence_handoff",
      "handoff_context",
      "perspective_delta",
      "source_ref_bridge",
      "trace_bridge",
      "trace_diagnostics",
    ].includes(panelId)
  ) {
    const status = context.source_status.delta_projection;
    return {
      status,
      reason: context.fallback_reason.delta_projection,
      source_status: status,
      notes: ["Delta Projection source/fallback status is preserved."],
    };
  }

  const currentStatus = context.source_status.current_perspective;
  return {
    status: currentStatus,
    reason: context.fallback_reason.current_perspective,
    source_status: currentStatus,
    notes: fallback.notes,
  };
}

function validationForPanel(
  panelId: AgentWorkplanePanelId,
): AgentWorkplaneValidationSummary {
  const smokeRefs = new Set<string>(NODE_CONTEXT_SMOKES);
  if (
    [
      "projection_candidates",
      "delta_batch",
      "handoff_builder_preview",
      "run_postmortem",
      "trace_diagnostics",
      "runner_state",
      "runner_delta_batch",
      "trace_bridge",
    ].includes(panelId)
  ) {
    smokeRefs.add("smoke:agent-workplane-projection-handoff-v0-1");
  }

  if (panelId === "legacy_cockpit_compatibility") {
    smokeRefs.add("smoke:agent-workplane-cockpit-inheritance-v0-1");
  }

  return buildValidationSummary([...smokeRefs]);
}

function debugNotesForPanel(
  panelId: AgentWorkplanePanelId,
  context: WorkplaneContextRead,
) {
  const notes = [
    "Stable panel/node metadata only; no visible control or action authority is added.",
  ];

  if (panelId === "legacy_cockpit_compatibility") {
    notes.push(
      "Legacy Cockpit remains an explicit compatibility path until native replacement and validation exist.",
    );
  }

  if (
    panelId === "run_postmortem" ||
    panelId === "runner_state" ||
    panelId === "runner_delta_batch"
  ) {
    notes.push(
      "Runner ledger integration is deferred; context is preview-only or not materialized.",
    );
  }

  if (
    context.fallback_reason.current_perspective ||
    context.fallback_reason.delta_projection
  ) {
    notes.push("Fixture fallback disclosure is active for at least one source.");
  }

  return notes;
}

function sourceRefsForPanel(
  panelId: AgentWorkplanePanelId,
  context: WorkplaneContextRead,
  allSourceRefs: string[],
) {
  if (panelId === "run_postmortem" || panelId === "runner_state") {
    return ["not_materialized:runner_postmortem_source"];
  }

  if (
    [
      "work_queue",
      "current_perspective",
      "review_queue",
      "current_objective",
      "authority_validation_debug",
    ].includes(panelId)
  ) {
    return collectCurrentPerspectiveSourceRefs(context);
  }

  if (
    [
      "delta_projection",
      "projection_candidates",
      "delta_batch",
      "runner_delta_batch",
      "handoff_builder_preview",
      "evidence_handoff",
      "handoff_context",
      "perspective_delta",
      "source_ref_bridge",
      "trace_bridge",
      "trace_diagnostics",
    ].includes(panelId)
  ) {
    return collectDeltaProjectionSourceRefs(context);
  }

  return allSourceRefs;
}

function relatedDeltaIdsForPanel(
  panelId: AgentWorkplanePanelId,
  context: WorkplaneContextRead,
) {
  if (
    [
      "delta_projection",
      "projection_candidates",
      "delta_batch",
      "runner_delta_batch",
      "review_queue",
      "workplane_inspector",
      "perspective_delta",
      "trace_bridge",
      "trace_diagnostics",
      "authority_validation_debug",
    ].includes(panelId)
  ) {
    return context.delta_projection_read.data.deltas.map((delta) => delta.delta_id);
  }

  return [];
}

function relatedBatchIdsForPanel(
  panelId: AgentWorkplanePanelId,
  context: WorkplaneContextRead,
) {
  if (
    [
      "delta_projection",
      "delta_batch",
      "runner_delta_batch",
      "workplane_inspector",
      "trace_bridge",
      "trace_diagnostics",
    ].includes(panelId)
  ) {
    return context.delta_projection_read.data.batches.map((batch) => batch.batch_id);
  }

  return [];
}

function relatedHandoffRefsForPanel(
  panelId: AgentWorkplanePanelId,
  context: WorkplaneContextRead,
) {
  if (
    [
      "evidence_handoff",
      "handoff_builder_preview",
      "handoff_context",
      "legacy_cockpit_compatibility",
    ].includes(panelId)
  ) {
    return collectHandoffRefs(context);
  }

  return [];
}

function relatedEventIdsForPanel(
  panelId: AgentWorkplanePanelId,
  context: WorkplaneContextRead,
) {
  if (
    [
      "work_queue",
      "current_objective",
      "workplane_inspector",
      "source_ref_bridge",
      "trace_bridge",
      "trace_diagnostics",
    ].includes(panelId)
  ) {
    const refs = context.delta_projection_read.data.source_refs;
    return uniqueStrings([
      ...refs.work_event_ids,
      ...refs.coordination_event_ids,
      ...refs.action_record_ids,
    ]);
  }

  return [];
}

function collectWorkplaneSourceRefs(context: WorkplaneContextRead) {
  return uniqueStrings([
    ...collectCurrentPerspectiveSourceRefs(context),
    ...collectDeltaProjectionSourceRefs(context),
  ]);
}

function collectCurrentPerspectiveSourceRefs(context: WorkplaneContextRead) {
  const current = context.current_perspective_read.data;
  const snapshotRefs = current.source_refs.perspective_snapshot.source_refs;

  return uniqueStrings([
    `current_perspective:${current.as_of}`,
    ...prefixRefs("state_entry", snapshotRefs.state_entry_ids),
    ...prefixRefs("pending_proposal", snapshotRefs.pending_proposal_ids),
    ...prefixRefs("evidence", snapshotRefs.evidence_ids),
    ...prefixRefs("work", snapshotRefs.work_ids),
    ...prefixRefs("work_event", snapshotRefs.work_event_ids),
    ...prefixRefs("action_record", snapshotRefs.action_record_ids),
    ...prefixRefs("tension", snapshotRefs.tension_ids),
    ...prefixRefs("execution_lane", snapshotRefs.execution_lane_ids),
    ...current.current_frame.source_refs,
    ...current.current_thesis.source_refs,
    ...current.active_goals.flatMap((goal) => goal.source_refs),
    ...current.open_questions.flatMap((question) => question.source_refs),
    ...current.active_risks.flatMap((risk) => risk.source_refs),
    ...current.next_candidates.flatMap((candidate) => candidate.source_refs),
    ...current.last_major_delta_refs.flatMap((deltaRef) => deltaRef.source_refs),
    ...current.gaps.flatMap((gap) => gap.source_refs),
    ...current.source_refs.project_constellation_refs,
    ...current.source_refs.snapshot_refs.map(
      (snapshot) => `snapshot:${snapshot.snapshot_id}`,
    ),
    ...current.source_refs.diagnostic_refs.map(
      (diagnostic) => `diagnostic:${diagnostic.diagnostic_id}`,
    ),
  ]);
}

function collectDeltaProjectionSourceRefs(context: WorkplaneContextRead) {
  const projection = context.delta_projection_read.data;
  const refs = projection.source_refs;

  return uniqueStrings([
    `delta_projection:${projection.as_of}`,
    ...prefixRefs("state_delta_proposal", refs.state_delta_proposal_ids),
    ...prefixRefs("work_event", refs.work_event_ids),
    ...prefixRefs("coordination_event", refs.coordination_event_ids),
    ...prefixRefs("action_record", refs.action_record_ids),
    ...prefixRefs("evidence_record", refs.evidence_record_ids),
    ...prefixRefs("dogfooding_record", refs.dogfooding_record_ids),
    ...refs.handoff_refs.map((ref) => `handoff:${ref}`),
    ...refs.codex_result_refs.map((ref) => `codex_result:${ref}`),
    ...refs.snapshot_refs.map((snapshot) => `snapshot:${snapshot.snapshot_id}`),
    ...refs.diagnostic_refs.map(
      (diagnostic) => `diagnostic:${diagnostic.diagnostic_id}`,
    ),
    ...projection.gaps.flatMap((gap) => gap.source_refs),
    ...projection.deltas.flatMap((delta) => [
      `delta:${delta.delta_id}`,
      ...delta.target_refs,
      ...delta.evidence_refs.map((ref) => `evidence:${ref.evidence_ref}`),
      ...delta.artifact_refs.map((ref) => `artifact:${ref.artifact_ref}`),
      ...delta.handoff_refs.map((ref) => `handoff:${ref.handoff_ref}`),
      ...delta.diagnostic_refs.map(
        (ref) => `diagnostic:${ref.diagnostic_id}`,
      ),
    ]),
  ]);
}

function collectHandoffRefs(context: WorkplaneContextRead) {
  const projection = context.delta_projection_read.data;
  return uniqueStrings([
    ...projection.source_refs.handoff_refs,
    ...projection.deltas.flatMap((delta) =>
      delta.handoff_refs.map((handoffRef) => handoffRef.handoff_ref),
    ),
  ]);
}

function chooseLatestTimestamp(left: string, right: string) {
  const leftParsed = Date.parse(left);
  const rightParsed = Date.parse(right);

  if (Number.isFinite(leftParsed) && Number.isFinite(rightParsed)) {
    return rightParsed > leftParsed ? right : left;
  }

  return left || right;
}

function prefixRefs(prefix: string, refs: string[]) {
  return refs.map((ref) => `${prefix}:${ref}`);
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((left, right) =>
    left.localeCompare(right),
  );
}
