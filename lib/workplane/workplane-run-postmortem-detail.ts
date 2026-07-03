import type { AgentWorkplaneNodeContextRead } from "@/types/agent-workplane-node";
import {
  WORKPLANE_RUN_POSTMORTEM_DETAIL_VERSION,
  type WorkplaneRunPostmortemAuthorityBoundary,
  type WorkplaneRunPostmortemDeltaBatchSummary,
  type WorkplaneRunPostmortemDetailRead,
  type WorkplaneRunPostmortemEventKind,
  type WorkplaneRunPostmortemEventSummary,
  type WorkplaneRunPostmortemGapDetail,
  type WorkplaneRunPostmortemRunStatus,
  type WorkplaneRunPostmortemRunSummary,
  type WorkplaneRunPostmortemSignal,
  type WorkplaneRunPostmortemSignalStatus,
  type WorkplaneRunPostmortemStatus,
  type WorkplaneRunPostmortemStepSummary,
  type WorkplaneRunPostmortemTimelineItem,
} from "@/types/workplane-run-postmortem-detail";
import type { WorkplaneContextRead } from "./read-workplane-context";
import type { WorkplaneRunnerDeltaBatchSummary } from "./read-runner-delta-batches-for-workplane";

export const WORKPLANE_RUN_POSTMORTEM_DETAIL_SIGNAL_IDS = [
  "runner_readback_available",
  "recovered_delta_batch_available",
  "validation_status_visible",
  "related_step_event_refs_visible",
  "source_refs_visible",
  "no_apply_boundary_visible",
  "insufficient_runner_baseline_visible",
] as const satisfies readonly WorkplaneRunPostmortemSignal["signal_id"][];

export const WORKPLANE_RUN_POSTMORTEM_DETAIL_EVENT_KINDS = [
  "run_created",
  "run_scheduled",
  "run_started",
  "run_completed",
  "run_needs_review",
  "run_blocked",
  "run_cancelled",
  "run_paused",
  "run_resumed",
  "step_started",
  "step_completed",
  "step_blocked",
  "delta_batch_recovered",
  "tick_skipped",
  "unknown",
] as const satisfies readonly WorkplaneRunPostmortemEventKind[];

export const WORKPLANE_RUN_POSTMORTEM_DETAIL_REQUIRED_PANEL_IDS = [
  "run_postmortem",
  "delta_batch",
  "review_memory_detail",
  "source_ref_bridge",
] as const;

export const WORKPLANE_RUN_POSTMORTEM_DETAIL_SMOKE_REFS = [
  "smoke:agent-workplane-run-postmortem-detail-v0-1",
  "smoke:workplane-runner-deltabatch-integration-v0-1",
  "smoke:workplane-native-browser-regression-v0-1",
  "smoke:agent-workplane-node-contract-v0-1",
] as const;

export type WorkplaneRunPostmortemDetailInput = {
  workplane_context: WorkplaneContextRead;
  node_context_read: AgentWorkplaneNodeContextRead;
};

export type ReadWorkplaneRunPostmortemDetailOptions =
  WorkplaneRunPostmortemDetailInput;

const RUN_POSTMORTEM_AUTHORITY_BOUNDARY: WorkplaneRunPostmortemAuthorityBoundary = {
  surface: "agent_workplane_run_postmortem_detail",
  read_only_run_postmortem_detail: true,
  can_write_db: false,
  can_write_runner_ledger: false,
  can_record_proof: false,
  can_create_evidence: false,
  can_update_work: false,
  can_mutate_memory: false,
  can_apply_project_perspective: false,
  can_apply_durable_memory: false,
  can_auto_apply_delta: false,
  can_call_provider_openai: false,
  can_call_github: false,
  can_actuate_github: false,
  can_execute_codex: false,
  can_execute_runner: false,
  can_tick_runner: false,
  can_schedule_runner: false,
  can_recover_delta_batch: false,
  can_create_branch_or_pr: false,
  can_send_handoff: false,
  can_merge_publish_retry_replay_deploy: false,
  can_delete_or_shrink_legacy_cockpit: false,
  can_hide_legacy_cockpit: false,
  notes: [
    "Run Postmortem detail is read-only run visibility only.",
    "It can display recovered runner DeltaBatch readback, run ids, step refs, event refs, validation status, source refs, and gaps, but it cannot execute runner work, tick a runner, schedule a runner, recover DeltaBatches, apply memory, apply Perspective, auto-apply deltas, approve, reject, commit, or mutate state.",
    "It does not write DB state, write runner ledger state, record proof, create evidence, update work, mutate memory, call providers, call GitHub, actuate GitHub, execute Codex, execute runner, schedule runner, recover DeltaBatch, create branches or PRs, send handoffs, merge, publish, retry, replay, deploy, delete Legacy Cockpit, shrink Legacy Cockpit, or hide Legacy Cockpit.",
    "Legacy Cockpit route/component removal is documented separately; this panel remains native read-only run visibility.",
  ],
};

export function readWorkplaneRunPostmortemDetail(
  options: ReadWorkplaneRunPostmortemDetailOptions,
): WorkplaneRunPostmortemDetailRead {
  return buildWorkplaneRunPostmortemDetailRead(options);
}

export function buildWorkplaneRunPostmortemDetailRead(
  input: WorkplaneRunPostmortemDetailInput,
): WorkplaneRunPostmortemDetailRead {
  const context = input.workplane_context;
  const nodeContext = input.node_context_read;
  const batches = context.runner_delta_batch_read.batches;
  const runSummaries = buildRunSummaries(batches, nodeContext);
  const stepSummaries = buildStepSummaries(batches);
  const eventSummaries = buildEventSummaries(batches);
  const deltaBatchSummaries = buildDeltaBatchSummaries(batches);
  const timelineItems = buildTimelineItems({
    runSummaries,
    stepSummaries,
    eventSummaries,
    deltaBatchSummaries,
    fallbackAsOf: chooseAsOf(context),
  });
  const postmortemSignals = buildSignals(context, batches);
  const gapDetails = buildGapDetails(context, batches);
  const sourceRefs = uniqueStrings([
    ...runSummaries.flatMap((run) => run.source_refs),
    ...stepSummaries.flatMap((step) => step.source_refs),
    ...eventSummaries.flatMap((event) => event.source_refs),
    ...deltaBatchSummaries.flatMap((batch) => batch.source_refs),
    ...timelineItems.flatMap((item) => item.source_refs),
    ...postmortemSignals.flatMap((signal) => signal.source_refs),
    ...gapDetails.flatMap((gap) => gap.source_refs),
    "docs:AGENT_WORKPLANE_RUN_POSTMORTEM_DETAIL_V0_1.md",
    "docs:COCKPIT_ROUTE_REMOVAL_READINESS_V0_1.md",
    "docs:COCKPIT_ROUTE_REMOVAL_V0_1.md",
  ]);

  return {
    version: WORKPLANE_RUN_POSTMORTEM_DETAIL_VERSION,
    status: summarizeStatus(context, batches),
    scope: context.overview.scope,
    as_of: chooseAsOf(context),
    run_summaries: runSummaries,
    step_summaries: stepSummaries,
    event_summaries: eventSummaries,
    delta_batch_summaries: deltaBatchSummaries,
    timeline_items: timelineItems,
    postmortem_signals: postmortemSignals,
    gap_details: gapDetails,
    authority_boundary: RUN_POSTMORTEM_AUTHORITY_BOUNDARY,
    source_refs: sourceRefs,
    fallback_notes: buildFallbackNotes(context),
    staleness_notes: buildStalenessNotes(context),
    validation_summary: {
      status: "partial",
      smoke_refs: [...WORKPLANE_RUN_POSTMORTEM_DETAIL_SMOKE_REFS],
      notes: [
        "Run Postmortem detail names smoke:agent-workplane-run-postmortem-detail-v0-1 as its native detail validation.",
        "Browser regression can inspect the run_postmortem panel marker, run postmortem detail marker, recovered DeltaBatch copy, source refs, step refs, event refs, and no-runner-authority copy.",
        "This validation summary is evidence for review, not runner authority and not shrink authority.",
      ],
    },
    notes: [
      "Built from WorkplaneContextRead and AgentWorkplaneNodeContextRead only.",
      "Uses runner_delta_batch_read already present in WorkplaneContextRead; it does not read the runner ledger directly.",
      "No runner lifecycle helper, runner tick, scheduler, DeltaBatch recovery write, route call, fetch, provider call, GitHub call, Codex execution, DB write, proof/evidence write, memory apply, Perspective apply, delta auto-apply, or Legacy Cockpit shrink is performed.",
    ],
  };
}

function buildRunSummaries(
  batches: WorkplaneRunnerDeltaBatchSummary[],
  nodeContext: AgentWorkplaneNodeContextRead,
): WorkplaneRunPostmortemRunSummary[] {
  const byRun = new Map<string, WorkplaneRunnerDeltaBatchSummary[]>();
  for (const batch of batches) {
    byRun.set(batch.run_id, [...(byRun.get(batch.run_id) ?? []), batch]);
  }

  return [...byRun.entries()]
    .map(([runId, runBatches]) => {
      const sorted = sortBatches(runBatches);
      const latest = sorted[0];
      const nodeRefs = nodeContext.panels
        .filter(
          (panel) =>
            panel.panel_id === "run_postmortem" ||
            panel.panel_id === "delta_batch",
        )
        .flatMap((panel) => panel.source_refs);

      return {
        run_id: runId,
        run_title: latest.run_title,
        run_status: normalizeRunStatus(latest.run_status),
        latest_batch_id: latest.batch_id,
        recovered_batch_count: sorted.length,
        recovered_delta_count: sorted.reduce(
          (count, batch) => count + batch.delta_count,
          0,
        ),
        validation_status: signalStatusFromValidation(
          latest.validation_status,
        ),
        source_refs: uniqueStrings([
          `autonomy_run:${runId}`,
          ...sorted.flatMap((batch) => batch.source_refs),
          ...nodeRefs,
        ]),
        related_step_ids: uniqueStrings(
          sorted.flatMap((batch) => batch.related_step_ids),
        ),
        related_event_ids: uniqueStrings(
          sorted.flatMap((batch) => batch.related_event_ids),
        ),
        related_delta_ids: uniqueStrings(
          sorted.flatMap((batch) => batch.related_delta_ids),
        ),
        notes: [
          "Run summary is derived from recovered runner DeltaBatch readback.",
          "Run status is display-only and does not execute, tick, schedule, or recover a runner.",
        ],
      };
    })
    .sort((left, right) => left.run_id.localeCompare(right.run_id));
}

function buildStepSummaries(
  batches: WorkplaneRunnerDeltaBatchSummary[],
): WorkplaneRunPostmortemStepSummary[] {
  const entries = new Map<string, WorkplaneRunnerDeltaBatchSummary[]>();
  for (const batch of batches) {
    for (const stepId of batch.related_step_ids) {
      entries.set(stepKey(batch.run_id, stepId), [
        ...(entries.get(stepKey(batch.run_id, stepId)) ?? []),
        batch,
      ]);
    }
  }

  return [...entries.entries()].map(([key, relatedBatches]) => {
    const [runId, stepId] = key.split("::");
    return {
      step_id: stepId,
      run_id: runId,
      status: "partial",
      source_refs: uniqueStrings([
        `autonomy_run_step:${stepId}`,
        ...relatedBatches.flatMap((batch) => batch.source_refs),
      ]),
      related_batch_ids: uniqueStrings(
        relatedBatches.map((batch) => batch.batch_id),
      ),
      related_delta_ids: uniqueStrings(
        relatedBatches.flatMap((batch) => batch.related_delta_ids),
      ),
      summary:
        "Step refs are source-backed by recovered runner DeltaBatch related_step_ids; direct step payload fields are not read here.",
    };
  });
}

function buildEventSummaries(
  batches: WorkplaneRunnerDeltaBatchSummary[],
): WorkplaneRunPostmortemEventSummary[] {
  const entries = new Map<string, WorkplaneRunnerDeltaBatchSummary[]>();
  for (const batch of batches) {
    for (const eventId of batch.related_event_ids) {
      entries.set(eventKey(batch.run_id, eventId), [
        ...(entries.get(eventKey(batch.run_id, eventId)) ?? []),
        batch,
      ]);
    }
  }

  return [...entries.entries()].map(([key, relatedBatches]) => {
    const [runId, eventId] = key.split("::");
    return {
      event_id: eventId,
      run_id: runId,
      event_kind: eventKindFromId(eventId),
      status: "partial",
      source_refs: uniqueStrings([
        `autonomy_run_event:${eventId}`,
        ...relatedBatches.flatMap((batch) => batch.source_refs),
      ]),
      related_batch_ids: uniqueStrings(
        relatedBatches.map((batch) => batch.batch_id),
      ),
      related_delta_ids: uniqueStrings(
        relatedBatches.flatMap((batch) => batch.related_delta_ids),
      ),
      summary:
        "Event refs are source-backed by recovered runner DeltaBatch related_event_ids; direct event payload fields are intentionally not read here.",
    };
  });
}

function buildDeltaBatchSummaries(
  batches: WorkplaneRunnerDeltaBatchSummary[],
): WorkplaneRunPostmortemDeltaBatchSummary[] {
  return sortBatches(batches).map((batch) => ({
    batch_id: batch.batch_id,
    run_id: batch.run_id,
    title: batch.title,
    summary: batch.summary,
    batch_status: statusFromBatchStatus(batch.batch_status),
    created_at: batch.created_at,
    delta_count: batch.delta_count,
    validation_status: signalStatusFromValidation(batch.validation_status),
    source_refs: uniqueStrings([
      `autonomy_run:${batch.run_id}`,
      `autonomy_run_delta_batch:${batch.batch_id}`,
      ...batch.source_refs,
    ]),
    related_step_ids: batch.related_step_ids,
    related_event_ids: batch.related_event_ids,
    related_delta_ids: batch.related_delta_ids,
    authority_notes: uniqueStrings([
      ...batch.runner_authority_boundary_notes,
      "Recovered DeltaBatch readback is not approval, apply, runner execution, runner tick, runner recovery, proof write, evidence write, durable memory apply, Perspective apply, or delta auto-apply.",
    ]),
  }));
}

function buildTimelineItems({
  runSummaries,
  stepSummaries,
  eventSummaries,
  deltaBatchSummaries,
  fallbackAsOf,
}: {
  runSummaries: WorkplaneRunPostmortemRunSummary[];
  stepSummaries: WorkplaneRunPostmortemStepSummary[];
  eventSummaries: WorkplaneRunPostmortemEventSummary[];
  deltaBatchSummaries: WorkplaneRunPostmortemDeltaBatchSummary[];
  fallbackAsOf: string;
}): WorkplaneRunPostmortemTimelineItem[] {
  const items: WorkplaneRunPostmortemTimelineItem[] = [];

  for (const run of runSummaries) {
    items.push({
      timeline_id: `run:${run.run_id}`,
      occurred_at: fallbackAsOf,
      item_kind: "run",
      title: `run_id ${run.run_id}`,
      summary: `${run.run_title}; status ${run.run_status}; latest batch ${run.latest_batch_id ?? "none"}.`,
      status: statusFromRunStatus(run.run_status),
      source_refs: run.source_refs,
    });
  }

  for (const batch of deltaBatchSummaries) {
    items.push({
      timeline_id: `delta_batch:${batch.batch_id}`,
      occurred_at: batch.created_at || fallbackAsOf,
      item_kind: "delta_batch",
      title: `recovered DeltaBatch ${batch.batch_id}`,
      summary: `${batch.title}; recovered ${batch.delta_count} deltas; validation status ${batch.validation_status}.`,
      status: batch.batch_status,
      source_refs: batch.source_refs,
    });
  }

  for (const step of stepSummaries.slice(0, 12)) {
    items.push({
      timeline_id: `step:${step.run_id}:${step.step_id}`,
      occurred_at: fallbackAsOf,
      item_kind: "step",
      title: `step refs ${step.step_id}`,
      summary: step.summary,
      status: step.status,
      source_refs: step.source_refs,
    });
  }

  for (const event of eventSummaries.slice(0, 12)) {
    items.push({
      timeline_id: `event:${event.run_id}:${event.event_id}`,
      occurred_at: fallbackAsOf,
      item_kind: "event",
      title: `event refs ${event.event_id}`,
      summary: event.summary,
      status: event.status,
      source_refs: event.source_refs,
    });
  }

  return items.sort((left, right) => {
    const timeDelta = timestamp(right.occurred_at) - timestamp(left.occurred_at);
    if (timeDelta !== 0) return timeDelta;
    return left.timeline_id.localeCompare(right.timeline_id);
  });
}

function buildSignals(
  context: WorkplaneContextRead,
  batches: WorkplaneRunnerDeltaBatchSummary[],
): WorkplaneRunPostmortemSignal[] {
  const hasBatches = batches.length > 0;
  const hasValidation = batches.some((batch) => batch.validation_status);
  const hasStepEventRefs = batches.some(
    (batch) =>
      batch.related_step_ids.length > 0 || batch.related_event_ids.length > 0,
  );
  const hasSourceRefs = batches.some((batch) => batch.source_refs.length > 0);

  return [
    {
      signal_id: "runner_readback_available",
      status:
        context.runner_delta_batch_read.status === "ready"
          ? "healthy"
          : context.runner_delta_batch_read.status === "fallback"
            ? "blocked"
            : "insufficient_data",
      summary:
        context.runner_delta_batch_read.status === "ready"
          ? "Runner readback is available through existing Workplane runner_delta_batch_read."
          : "Runner readback is empty or fallback in the current Workplane context.",
      source_refs: [
        `runner_delta_batch_read:${context.runner_delta_batch_read.source_status}`,
      ],
    },
    {
      signal_id: "recovered_delta_batch_available",
      status: hasBatches ? "healthy" : "insufficient_data",
      summary: hasBatches
        ? "Recovered DeltaBatch summaries are visible."
        : "No recovered DeltaBatch is materialized yet.",
      source_refs: batches.map((batch) => `autonomy_run_delta_batch:${batch.batch_id}`),
    },
    {
      signal_id: "validation_status_visible",
      status: hasValidation ? "healthy" : "insufficient_data",
      summary: hasValidation
        ? "Validation status is visible from recovered DeltaBatch readback."
        : "Validation status is not materialized without recovered batches.",
      source_refs: batches.map((batch) => `validation:${batch.batch_id}`),
    },
    {
      signal_id: "related_step_event_refs_visible",
      status: hasStepEventRefs ? "healthy" : "watch",
      summary: hasStepEventRefs
        ? "Related step refs and event refs are visible from recovered batches."
        : "Step/event refs are not materialized; direct runner ledger payload details remain a gap.",
      source_refs: uniqueStrings([
        ...batches.flatMap((batch) =>
          batch.related_step_ids.map((stepId) => `autonomy_run_step:${stepId}`),
        ),
        ...batches.flatMap((batch) =>
          batch.related_event_ids.map(
            (eventId) => `autonomy_run_event:${eventId}`,
          ),
        ),
      ]),
    },
    {
      signal_id: "source_refs_visible",
      status: hasSourceRefs ? "healthy" : "watch",
      summary: hasSourceRefs
        ? "Source refs are visible for Run Postmortem review."
        : "Source refs are not materialized yet.",
      source_refs: batches.flatMap((batch) => batch.source_refs),
    },
    {
      signal_id: "no_apply_boundary_visible",
      status: "healthy",
      summary:
        "The Run Postmortem detail authority boundary denies runner execution, runner tick, DeltaBatch recovery, durable memory apply, Perspective apply, delta auto-apply, and shrink authority.",
      source_refs: [
        "docs:AGENT_WORKPLANE_RUN_POSTMORTEM_DETAIL_V0_1.md",
      ],
    },
    {
      signal_id: "insufficient_runner_baseline_visible",
      status: "watch",
      summary:
        "Repeated metrics/dogfood baselines are still required before any shrink candidate.",
      source_refs: [
        "docs:AUGNES_WORKFLOW_METRICS_V0_1.md",
        "docs:AUGNES_ON_AUGNES_DOGFOOD_V0_1.md",
      ],
    },
  ];
}

function buildGapDetails(
  context: WorkplaneContextRead,
  batches: WorkplaneRunnerDeltaBatchSummary[],
): WorkplaneRunPostmortemGapDetail[] {
  return [
    {
      gap_id: "missing_direct_runner_ledger_event_payload_detail",
      status: "partial",
      summary:
        "Run Postmortem detail shows run_id, step refs, event refs, and recovered DeltaBatch refs from Workplane readback, but it does not read direct runner ledger event payload detail.",
      required_next_step:
        "Add richer read-only event payload mapping only in a future native detail PR if browser/dogfood review shows it is needed.",
      source_refs: uniqueStrings([
        ...batches.flatMap((batch) =>
          batch.related_event_ids.map(
            (eventId) => `autonomy_run_event:${eventId}`,
          ),
        ),
        "docs:AGENT_WORKPLANE_RUNNER_DELTABATCH_INTEGRATION_V0_1.md",
      ]),
    },
    {
      gap_id: "missing_richer_postmortem_timeline",
      status: batches.length > 0 ? "partial" : "insufficient_data",
      summary:
        "Timeline rows are assembled from recovered batch timestamps and related ids; richer run/step/event chronology is not yet materialized when no recovered batches exist.",
      required_next_step:
        "Keep timeline review-gated and do not infer unobserved runner events.",
      source_refs: [
        `runner_delta_batch:${context.runner_delta_batch_read.latest_batch_id ?? "none"}`,
      ],
    },
    {
      gap_id: "missing_repeated_dogfood_metrics_baseline",
      status: "needs_review",
      summary:
        "Run Postmortem native detail improves work/run visibility, but repeated dogfood and metrics baselines are still required before a shrink candidate.",
      required_next_step:
        "Run another dogfood/metrics baseline and keep browser regression, metrics, dogfood, rollback, and human review as separate gates.",
      source_refs: [
        "docs:AUGNES_WORKFLOW_METRICS_V0_1.md",
        "docs:AUGNES_ON_AUGNES_DOGFOOD_V0_1.md",
      ],
    },
    {
      gap_id: "missing_legacy_local_ui_control_classification",
      status: "partial",
      summary:
        "Legacy local UI control review moved to the native manual controls migration rows before route removal.",
      required_next_step:
        "Keep blocked local-write/apply controls under the separate authority-contract boundary; do not reintroduce Cockpit as a review surface.",
      source_refs: [
        "docs:COCKPIT_MANUAL_CONTROLS_MIGRATION_V0_1.md",
        "docs:COCKPIT_ROUTE_REMOVAL_V0_1.md",
      ],
    },
  ];
}

function summarizeStatus(
  context: WorkplaneContextRead,
  batches: WorkplaneRunnerDeltaBatchSummary[],
): WorkplaneRunPostmortemStatus {
  if (context.runner_delta_batch_read.status === "fallback") return "fallback";
  if (batches.length === 0) return "empty";
  if (
    batches.some(
      (batch) =>
        batch.validation_status === "blocked" ||
        batch.validation_status === "needs_review" ||
        batch.run_status === "blocked" ||
        batch.run_status === "needs_review",
    )
  ) {
    return "needs_review";
  }
  return "partial";
}

function buildFallbackNotes(context: WorkplaneContextRead) {
  return uniqueStrings([
    context.fallback_reason.runner_delta_batch,
    `source_status.runner_delta_batch=${context.source_status.runner_delta_batch}`,
    `runner_delta_batch_status=${context.runner_delta_batch_read.status}`,
    ...context.runner_delta_batch_read.fallback_status.notes,
  ].filter((note): note is string => Boolean(note)));
}

function buildStalenessNotes(context: WorkplaneContextRead) {
  return uniqueStrings([
    `runner_delta_batch_staleness=${context.runner_delta_batch_read.staleness.status}`,
    `runner_delta_batch_as_of=${context.runner_delta_batch_read.as_of ?? "none"}`,
    ...context.runner_delta_batch_read.staleness.notes,
  ]);
}

function chooseAsOf(context: WorkplaneContextRead) {
  return (
    context.runner_delta_batch_read.as_of ??
    chooseLatestTimestamp(
      context.current_perspective_read.data.as_of,
      context.delta_projection_read.data.as_of,
    )
  );
}

function normalizeRunStatus(
  status: string,
): WorkplaneRunPostmortemRunStatus {
  const allowed: WorkplaneRunPostmortemRunStatus[] = [
    "planned",
    "running",
    "paused",
    "blocked",
    "completed",
    "needs_review",
    "cancelled",
    "scheduled",
    "failed",
    "stopped",
    "unknown",
  ];
  return allowed.includes(status as WorkplaneRunPostmortemRunStatus)
    ? (status as WorkplaneRunPostmortemRunStatus)
    : "unknown";
}

function statusFromRunStatus(
  status: WorkplaneRunPostmortemRunStatus,
): WorkplaneRunPostmortemStatus {
  if (status === "completed") return "ready";
  if (
    status === "blocked" ||
    status === "needs_review" ||
    status === "failed" ||
    status === "stopped"
  ) {
    return "needs_review";
  }
  if (status === "unknown") return "insufficient_data";
  return "partial";
}

function statusFromBatchStatus(status: string): WorkplaneRunPostmortemStatus {
  if (status === "completed") return "ready";
  if (status === "blocked" || status === "needs_review") return "needs_review";
  return "partial";
}

function signalStatusFromValidation(
  status: string | null,
): WorkplaneRunPostmortemSignalStatus {
  if (status === "passed") return "healthy";
  if (status === "blocked") return "blocked";
  if (status === "needs_review") return "needs_review";
  if (!status) return "insufficient_data";
  return "watch";
}

function eventKindFromId(eventId: string): WorkplaneRunPostmortemEventKind {
  const lower = eventId.toLowerCase();
  for (const kind of WORKPLANE_RUN_POSTMORTEM_DETAIL_EVENT_KINDS) {
    if (kind !== "unknown" && lower.includes(kind)) return kind;
  }
  return "unknown";
}

function stepKey(runId: string, stepId: string) {
  return `${runId}::${stepId}`;
}

function eventKey(runId: string, eventId: string) {
  return `${runId}::${eventId}`;
}

function sortBatches(batches: WorkplaneRunnerDeltaBatchSummary[]) {
  return [...batches].sort((left, right) => {
    const createdDelta = timestamp(right.created_at) - timestamp(left.created_at);
    if (createdDelta !== 0) return createdDelta;
    return left.batch_id.localeCompare(right.batch_id);
  });
}

function chooseLatestTimestamp(left: string, right: string) {
  const leftTime = timestamp(left);
  const rightTime = timestamp(right);
  if (leftTime === 0) return right;
  if (rightTime === 0) return left;
  return rightTime > leftTime ? right : left;
}

function timestamp(value: string) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function uniqueStrings(values: readonly string[]) {
  return [...new Set(values.filter(Boolean))].sort((left, right) =>
    left.localeCompare(right),
  );
}
