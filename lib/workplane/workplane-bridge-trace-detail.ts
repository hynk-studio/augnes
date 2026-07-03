import type { AgentWorkplaneNodeContextRead } from "@/types/agent-workplane-node";
import type {
  WorkplaneBridgeTraceBridgeRow,
  WorkplaneBridgeTraceDetailRead,
  WorkplaneBridgeTraceDetailRef,
  WorkplaneBridgeTraceDiagnosticDetail,
  WorkplaneBridgeTraceEvidenceDetail,
  WorkplaneBridgeTraceGapDetail,
  WorkplaneBridgeTraceRefKind,
  WorkplaneBridgeTraceStatus,
  WorkplaneBridgeTraceValidationDetail,
} from "@/types/workplane-bridge-trace-detail";
import {
  WORKPLANE_BRIDGE_TRACE_DETAIL_VERSION,
  type WorkplaneBridgeTraceAuthorityBoundary,
} from "@/types/workplane-bridge-trace-detail";
import type { WorkplaneContextRead } from "./read-workplane-context";

export const WORKPLANE_BRIDGE_TRACE_DETAIL_REQUIRED_REF_KINDS = [
  "current_perspective",
  "delta_projection",
  "projected_delta_batch",
  "runner_delta_batch",
  "work_event",
  "coordination_event",
  "action_record",
  "evidence",
  "artifact",
  "handoff",
  "diagnostic",
  "snapshot",
  "smoke",
  "docs",
  "repo",
] as const satisfies readonly WorkplaneBridgeTraceRefKind[];

export const WORKPLANE_BRIDGE_TRACE_DETAIL_REQUIRED_BRIDGE_ROWS = [
  "source_ref_bridge",
  "trace_bridge",
  "delta_projection",
  "projected_delta_batch",
  "runner_delta_batch",
] as const;

export const WORKPLANE_BRIDGE_TRACE_DETAIL_SMOKE_REFS = [
  "smoke:agent-workplane-bridge-trace-detail-v0-1",
  "smoke:workplane-native-browser-regression-v0-1",
  "smoke:agent-workplane-node-contract-v0-1",
  "smoke:workplane-runner-deltabatch-integration-v0-1",
] as const;

export type WorkplaneBridgeTraceDetailInput = {
  workplane_context: WorkplaneContextRead;
  node_context_read: AgentWorkplaneNodeContextRead;
};

export type ReadWorkplaneBridgeTraceDetailOptions = {
  workplane_context: WorkplaneContextRead;
  node_context_read: AgentWorkplaneNodeContextRead;
};

const BRIDGE_TRACE_AUTHORITY_BOUNDARY: WorkplaneBridgeTraceAuthorityBoundary = {
  surface: "agent_workplane_bridge_trace_detail",
  read_only_bridge_trace_detail: true,
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
  can_schedule_runner: false,
  can_recover_delta_batch: false,
  can_create_branch_or_pr: false,
  can_send_handoff: false,
  can_merge_publish_retry_replay_deploy: false,
  can_delete_or_shrink_legacy_cockpit: false,
  can_hide_legacy_cockpit: false,
  notes: [
    "Source Ref Bridge and Trace Bridge detail is read-only native absorption context.",
    "It does not write DB state, write runner ledger state, record proof, create evidence, update work, mutate memory, apply Perspective, apply durable memory, auto-apply deltas, call providers, call GitHub, actuate GitHub, execute Codex, execute runner, schedule runner, recover DeltaBatch, create branches or PRs, send handoffs, merge, publish, retry, replay, deploy, delete Legacy Cockpit, shrink Legacy Cockpit, or hide Legacy Cockpit.",
    "Legacy Cockpit compatibility remains rendered and is treated as rollback/context, not cleanup residue.",
  ],
};

export function readWorkplaneBridgeTraceDetail(
  options: ReadWorkplaneBridgeTraceDetailOptions,
): WorkplaneBridgeTraceDetailRead {
  return buildWorkplaneBridgeTraceDetailRead(options);
}

export function buildWorkplaneBridgeTraceDetailRead(
  input: WorkplaneBridgeTraceDetailInput,
): WorkplaneBridgeTraceDetailRead {
  const context = input.workplane_context;
  const nodeContext = input.node_context_read;
  const sourceRefs = buildDetailRefs(context, nodeContext);
  const sourceRefKinds = buildSourceRefKindSummary(sourceRefs);
  const bridgeRows = buildBridgeRows(context, nodeContext, sourceRefs);
  const validationDetails = buildValidationDetails(context, nodeContext);
  const evidenceDetails = buildEvidenceDetails(context);
  const diagnosticDetails = buildDiagnosticDetails(context);
  const gapDetails = buildGapDetails(context);
  const status = summarizeStatus({
    context,
    sourceRefs,
    bridgeRows,
    gapDetails,
  });

  return {
    version: WORKPLANE_BRIDGE_TRACE_DETAIL_VERSION,
    status,
    scope: context.overview.scope,
    as_of: chooseLatestTimestamp(
      chooseLatestTimestamp(
        context.current_perspective_read.data.as_of,
        context.delta_projection_read.data.as_of,
      ),
      context.runner_delta_batch_read.as_of ?? "",
    ),
    bridge_rows: bridgeRows,
    source_ref_kinds: sourceRefKinds,
    refs: sourceRefs,
    validation_details: validationDetails,
    evidence_details: evidenceDetails,
    diagnostic_details: diagnosticDetails,
    gap_details: gapDetails,
    authority_boundary: BRIDGE_TRACE_AUTHORITY_BOUNDARY,
    source_refs: uniqueStrings(sourceRefs.flatMap((ref) => ref.source_refs)),
    fallback_notes: buildFallbackNotes(context),
    staleness_notes: buildStalenessNotes(context),
    validation_summary: {
      status: "partial",
      smoke_refs: [...WORKPLANE_BRIDGE_TRACE_DETAIL_SMOKE_REFS],
      notes: [
        "Bridge/trace detail names smoke:agent-workplane-bridge-trace-detail-v0-1 as its native detail validation.",
        "Browser regression can inspect the Source Ref Bridge panel marker and bridge/trace copy.",
        "This validation summary is evidence for review, not shrink authority.",
      ],
    },
    notes: [
      "Built from WorkplaneContextRead and AgentWorkplaneNodeContextRead only.",
      "No runner lifecycle helper, DeltaBatch recovery write, route call, fetch, provider call, GitHub call, Codex execution, DB write, proof/evidence write, memory apply, Perspective apply, delta auto-apply, or Legacy Cockpit shrink is performed.",
      "Source-backed Run Postmortem fields and review/memory proposal detail remain explicit gaps.",
    ],
  };
}

function buildDetailRefs(
  context: WorkplaneContextRead,
  nodeContext: AgentWorkplaneNodeContextRead,
): WorkplaneBridgeTraceDetailRef[] {
  const refs: WorkplaneBridgeTraceDetailRef[] = [];

  const pushRef = ({
    refId,
    sourcePanelId,
    sourceNodeId,
    summary,
    sourceRefs,
    status = "partial",
  }: {
    refId: string;
    sourcePanelId: string;
    sourceNodeId: string;
    summary: string;
    sourceRefs?: string[];
    status?: WorkplaneBridgeTraceStatus;
  }) => {
    refs.push({
      ref_id: refId,
      ref_kind: classifyRefKind(refId),
      label: labelForRef(refId),
      summary,
      source_panel_id: sourcePanelId,
      source_node_id: sourceNodeId,
      source_refs: sourceRefs?.length ? sourceRefs : [refId],
      status,
    });
  };

  pushRef({
    refId: `current_perspective:${context.current_perspective_read.data.as_of}`,
    sourcePanelId: "current_perspective",
    sourceNodeId: "current_perspective",
    summary: "Current Perspective read timestamp.",
  });
  pushRef({
    refId: `delta_projection:${context.delta_projection_read.data.as_of}`,
    sourcePanelId: "delta_projection",
    sourceNodeId: "perspective_delta",
    summary: "Delta Projection read timestamp.",
  });
  pushRef({
    refId: "repo:hynk-studio/augnes",
    sourcePanelId: "source_ref_bridge",
    sourceNodeId: "source_ref_bridge",
    summary: "Repository context for Workplane bridge/trace review.",
  });
  pushRef({
    refId: "docs:AGENT_WORKPLANE_BRIDGE_TRACE_DETAIL_V0_1.md",
    sourcePanelId: "source_ref_bridge",
    sourceNodeId: "source_ref_bridge",
    summary: "Bridge/trace detail documentation pointer.",
  });
  pushRef({
    refId: "docs:COCKPIT_ROUTE_REMOVAL_READINESS_V0_1.md",
    sourcePanelId: "source_ref_bridge",
    sourceNodeId: "source_ref_bridge",
    summary:
      "Route removal readiness verified unique useful Cockpit-only capability count is 0.",
  });
  pushRef({
    refId: "docs:COCKPIT_ROUTE_REMOVAL_V0_1.md",
    sourcePanelId: "source_ref_bridge",
    sourceNodeId: "source_ref_bridge",
    summary: "Cockpit route/component removal documentation pointer.",
  });

  for (const smokeRef of WORKPLANE_BRIDGE_TRACE_DETAIL_SMOKE_REFS) {
    pushRef({
      refId: smokeRef,
      sourcePanelId: "source_ref_bridge",
      sourceNodeId: "source_ref_bridge",
      summary: "Validation smoke reference for bridge/trace detail.",
    });
  }

  for (const panel of nodeContext.panels) {
    for (const sourceRef of panel.source_refs) {
      pushRef({
        refId: sourceRef,
        sourcePanelId: panel.panel_id,
        sourceNodeId: panel.node_id,
        summary: `${panel.title} source ref from node context.`,
        status: statusFromNodeStatus(panel.status),
      });
    }
  }

  for (const batch of context.delta_projection_read.data.batches) {
    pushRef({
      refId: `projected_delta_batch:${batch.batch_id}`,
      sourcePanelId: "projected_delta_batch",
      sourceNodeId: "perspective_delta",
      summary: batch.summary,
      sourceRefs: [`delta_batch:${batch.batch_id}`],
      status: "partial",
    });
  }

  for (const batch of context.runner_delta_batch_read.batches) {
    pushRef({
      refId: `runner_delta_batch:${batch.batch_id}`,
      sourcePanelId: "delta_batch",
      sourceNodeId: "runner_delta_batch",
      summary: batch.summary,
      sourceRefs: batch.source_refs,
      status: batch.source_ref_count > 0 ? "partial" : "insufficient_data",
    });
  }

  return dedupeRefs(refs);
}

function buildSourceRefKindSummary(refs: WorkplaneBridgeTraceDetailRef[]) {
  return WORKPLANE_BRIDGE_TRACE_DETAIL_REQUIRED_REF_KINDS.map((kind) => {
    const matchingRefs = refs.filter((ref) => ref.ref_kind === kind);
    const status: WorkplaneBridgeTraceStatus =
      matchingRefs.length > 0 ? "partial" : "insufficient_data";
    return {
      ref_kind: kind,
      ref_count: matchingRefs.length,
      sample_refs: matchingRefs.slice(0, 5).map((ref) => ref.ref_id),
      status,
    };
  });
}

function buildBridgeRows(
  context: WorkplaneContextRead,
  nodeContext: AgentWorkplaneNodeContextRead,
  refs: WorkplaneBridgeTraceDetailRef[],
): WorkplaneBridgeTraceBridgeRow[] {
  const definitions = [
    {
      row_id: "source_ref_bridge",
      title: "Source Ref Bridge",
      source_panel_id: "source_ref_bridge",
      source_node_id: "source_ref_bridge",
      trace_role:
        "Bridge matrix detail for source refs, fallback status, and retained compatibility.",
      ref_kinds: [
        "current_perspective",
        "delta_projection",
        "work_event",
        "coordination_event",
        "action_record",
        "evidence",
        "artifact",
        "handoff",
        "docs",
        "repo",
      ],
      authority_summary: "Read-only bridge detail; no draft, record, commit-state, provider, GitHub, Codex, runner, DB, proof/evidence, memory, Perspective, delta apply, or shrink authority.",
    },
    {
      row_id: "trace_bridge",
      title: "Trace Bridge",
      source_panel_id: "trace_diagnostics",
      source_node_id: "trace_bridge",
      trace_role:
        "Trace rows for diagnostics, snapshots, validation summaries, and gaps.",
      ref_kinds: ["diagnostic", "snapshot", "smoke", "delta_projection"],
      authority_summary: "Read-only trace detail; no runtime trace collector, scheduler, runner tick, recovery write, or proof/evidence write.",
    },
    {
      row_id: "delta_projection",
      title: "Native Delta Projection",
      source_panel_id: "delta_projection",
      source_node_id: "perspective_delta",
      trace_role:
        "Native Delta Projection panel remains distinct from projected batch preview and runner DeltaBatch readback.",
      ref_kinds: ["delta_projection", "evidence", "artifact", "handoff", "diagnostic"],
      authority_summary: "Projection context is review-only and cannot auto-apply deltas.",
    },
    {
      row_id: "projected_delta_batch",
      title: "Projected Delta Batch preview",
      source_panel_id: "projected_delta_batch",
      source_node_id: "perspective_delta",
      trace_role:
        "Projected Delta Batch preview uses perspective_delta identity and is not recovered runner DeltaBatch readback.",
      ref_kinds: ["projected_delta_batch", "delta_projection"],
      authority_summary: "Projected batch preview has no approve, reject, apply, recover, or runner authority.",
    },
    {
      row_id: "runner_delta_batch",
      title: "Recovered runner DeltaBatch readback",
      source_panel_id: "delta_batch",
      source_node_id: "runner_delta_batch",
      trace_role:
        "Recovered runner DeltaBatch readback uses runner_delta_batch identity and remains separate from perspective_delta projection.",
      ref_kinds: ["runner_delta_batch", "work_event", "coordination_event"],
      authority_summary: "Runner DeltaBatch readback does not execute, tick, schedule, recover, or write runner ledger state.",
    },
    {
      row_id: "cockpit_route_removal_evidence",
      title: "Cockpit route removal evidence",
      source_panel_id: "source_ref_bridge",
      source_node_id: "source_ref_bridge",
      trace_role:
        "Route removal evidence verifies Cockpit-only useful capability count is 0 and native surfaces carry migrated review context.",
      ref_kinds: ["docs", "smoke"],
      authority_summary:
        "Route removal evidence does not add apply, execution, provider, runner, DB, proof, evidence, memory, Perspective, or delta authority.",
    },
  ] as const;

  return definitions.map((definition) => {
    const matchingRefs = refs.filter((ref) =>
      (definition.ref_kinds as readonly WorkplaneBridgeTraceRefKind[]).includes(
        ref.ref_kind,
      ),
    );
    const node = nodeContext.nodes.find(
      (item) =>
        item.panel_id === definition.source_panel_id ||
        item.node_id === definition.source_node_id,
    );
    const status = rowStatus({
      rowId: definition.row_id,
      context,
      hasRefs: matchingRefs.length > 0,
      nodeStatus: node?.status,
    });

    return {
      row_id: definition.row_id,
      title: definition.title,
      source_panel_id: definition.source_panel_id,
      source_node_id: definition.source_node_id,
      trace_role: definition.trace_role,
      ref_kinds: [...definition.ref_kinds],
      ref_count: matchingRefs.length,
      sample_refs: matchingRefs.slice(0, 5).map((ref) => ref.ref_id),
      validation_status: status,
      authority_summary: definition.authority_summary,
      status,
    };
  });
}

function buildValidationDetails(
  context: WorkplaneContextRead,
  nodeContext: AgentWorkplaneNodeContextRead,
): WorkplaneBridgeTraceValidationDetail[] {
  const nodeValidationDetails = nodeContext.nodes
    .filter((node) =>
      [
        "source_ref_bridge",
        "trace_bridge",
        "delta_projection",
        "projected_delta_batch",
        "delta_batch",
        "evidence_handoff",
        "workplane_inspector",
        "trace_diagnostics",
      ].includes(node.panel_id),
    )
    .map((node) => ({
      validation_id: `${node.panel_id}:node_validation`,
      source_panel_id: node.panel_id,
      source_node_id: node.node_id,
      status: statusFromValidationStatus(node.validation_summary.status),
      smoke_refs: node.validation_summary.smoke_refs,
      required_checks: node.validation_summary.smoke_refs,
      completed_checks: [],
      failed_checks: [],
      skipped_checks: [],
      notes: node.validation_summary.notes,
      source_refs: node.source_refs,
    }));

  const batchValidationDetails =
    context.delta_projection_read.data.batches.map((batch) => ({
      validation_id: `${batch.batch_id}:projected_batch_validation`,
      source_panel_id: "projected_delta_batch",
      source_node_id: "perspective_delta",
      status: statusFromValidationStatus(batch.validation_summary.validation_status),
      smoke_refs: batch.validation_summary.required_checks.filter((check) =>
        check.startsWith("smoke:"),
      ),
      required_checks: batch.validation_summary.required_checks,
      completed_checks: batch.validation_summary.completed_checks,
      failed_checks: batch.validation_summary.failed_checks,
      skipped_checks: batch.validation_summary.skipped_checks,
      notes: batch.validation_summary.notes,
      source_refs: [`projected_delta_batch:${batch.batch_id}`],
    }));

  const deltaValidationDetails = context.delta_projection_read.data.deltas
    .filter((delta) => delta.validation_summary)
    .map((delta) => ({
      validation_id: `${delta.delta_id}:delta_validation`,
      source_panel_id: "delta_projection",
      source_node_id: "perspective_delta",
      status: statusFromValidationStatus(
        delta.validation_summary?.validation_status ?? "not_run",
      ),
      smoke_refs:
        delta.validation_summary?.required_checks.filter((check) =>
          check.startsWith("smoke:"),
        ) ?? [],
      required_checks: delta.validation_summary?.required_checks ?? [],
      completed_checks: delta.validation_summary?.completed_checks ?? [],
      failed_checks: delta.validation_summary?.failed_checks ?? [],
      skipped_checks: delta.validation_summary?.skipped_checks ?? [],
      notes: delta.validation_summary?.notes ?? [],
      source_refs: [`delta:${delta.delta_id}`],
    }));

  const runnerValidationDetail: WorkplaneBridgeTraceValidationDetail = {
    validation_id: "runner_delta_batch:readback_validation",
    source_panel_id: "delta_batch",
    source_node_id: "runner_delta_batch",
    status:
      context.runner_delta_batch_read.status === "ready"
        ? "partial"
        : context.runner_delta_batch_read.status === "fallback"
          ? "fallback"
          : "insufficient_data",
    smoke_refs: context.runner_delta_batch_read.validation_summary.smoke_refs,
    required_checks: context.runner_delta_batch_read.validation_summary.smoke_refs,
    completed_checks: [],
    failed_checks: [],
    skipped_checks: [],
    notes: context.runner_delta_batch_read.validation_summary.notes,
    source_refs: context.runner_delta_batch_read.batches.flatMap(
      (batch) => batch.source_refs,
    ),
  };

  return [
    ...nodeValidationDetails,
    ...batchValidationDetails,
    ...deltaValidationDetails,
    runnerValidationDetail,
  ];
}

function buildEvidenceDetails(
  context: WorkplaneContextRead,
): WorkplaneBridgeTraceEvidenceDetail[] {
  const projection = context.delta_projection_read.data;
  return projection.deltas.flatMap((delta) => [
    ...delta.evidence_refs.map((ref) => ({
      detail_id: `${delta.delta_id}:evidence:${ref.evidence_ref}`,
      ref_kind: "evidence" as const,
      source_delta_id: delta.delta_id,
      ref_id: ref.evidence_ref,
      summary: ref.summary,
      pointer_semantics: ref.pointer_semantics,
      status: ref.verified_status,
      authority_notes: [
        `proof_write_authority:${ref.proof_write_authority}`,
        `evidence_write_authority:${ref.evidence_write_authority}`,
      ],
      source_refs: [`delta:${delta.delta_id}`, `evidence:${ref.evidence_ref}`],
    })),
    ...delta.artifact_refs.map((ref) => ({
      detail_id: `${delta.delta_id}:artifact:${ref.artifact_ref}`,
      ref_kind: "artifact" as const,
      source_delta_id: delta.delta_id,
      ref_id: ref.artifact_ref,
      summary: ref.summary,
      pointer_semantics: ref.pointer_semantics,
      status: `source_of_truth:${ref.source_of_truth}`,
      authority_notes: ["artifact pointer only; not source of truth"],
      source_refs: [`delta:${delta.delta_id}`, `artifact:${ref.artifact_ref}`],
    })),
    ...delta.handoff_refs.map((ref) => ({
      detail_id: `${delta.delta_id}:handoff:${ref.handoff_ref}`,
      ref_kind: "handoff" as const,
      source_delta_id: delta.delta_id,
      ref_id: ref.handoff_ref,
      summary: ref.summary,
      pointer_semantics: ref.pointer_semantics,
      status: ref.handoff_kind,
      authority_notes: [
        `execution_authority:${ref.execution_authority}`,
        `external_send_authority:${ref.external_send_authority}`,
      ],
      source_refs: [`delta:${delta.delta_id}`, `handoff:${ref.handoff_ref}`],
    })),
  ]);
}

function buildDiagnosticDetails(
  context: WorkplaneContextRead,
): WorkplaneBridgeTraceDiagnosticDetail[] {
  const current = context.current_perspective_read.data;
  const projection = context.delta_projection_read.data;
  const currentDiagnostics = current.source_refs.diagnostic_refs.map((ref) => ({
    detail_id: `current_perspective:diagnostic:${ref.diagnostic_id}`,
    ref_kind: "diagnostic" as const,
    source_panel_id: "current_perspective",
    ref_id: ref.diagnostic_id,
    summary: ref.summary,
    status: ref.status,
    notes: ref.non_authority_notes,
    source_refs: [ref.source_ref],
  }));
  const projectionDiagnostics = [
    ...projection.source_refs.diagnostic_refs,
    ...projection.deltas.flatMap((delta) => delta.diagnostic_refs),
    ...projection.batches.flatMap((batch) => batch.diagnostic_refs),
  ].map((ref) => ({
    detail_id: `delta_projection:diagnostic:${ref.diagnostic_id}`,
    ref_kind: "diagnostic" as const,
    source_panel_id: "trace_diagnostics",
    ref_id: ref.diagnostic_id,
    summary: ref.summary,
    status: ref.status,
    notes: ref.non_authority_notes,
    source_refs: [ref.source_ref],
  }));
  const snapshots = [
    ...current.source_refs.snapshot_refs.map((ref) => ({
      detail_id: `current_perspective:snapshot:${ref.snapshot_id}`,
      ref_kind: "snapshot" as const,
      source_panel_id: "current_perspective",
      ref_id: ref.snapshot_id,
      summary: ref.snapshot_kind,
      status: ref.staleness_status,
      notes: ref.freshness_notes,
      source_refs: ref.source_refs,
    })),
    ...projection.source_refs.snapshot_refs.map((ref) => ({
      detail_id: `delta_projection:snapshot:${ref.snapshot_id}`,
      ref_kind: "snapshot" as const,
      source_panel_id: "delta_projection",
      ref_id: ref.snapshot_id,
      summary: ref.snapshot_kind,
      status: ref.staleness_status,
      notes: ref.freshness_notes,
      source_refs: ref.source_refs,
    })),
    ...projection.batches.flatMap((batch) =>
      batch.snapshot_refs.map((ref) => ({
        detail_id: `${batch.batch_id}:snapshot:${ref.snapshot_id}`,
        ref_kind: "snapshot" as const,
        source_panel_id: "projected_delta_batch",
        ref_id: ref.snapshot_id,
        summary: ref.snapshot_kind,
        status: ref.staleness_status,
        notes: ref.freshness_notes,
        source_refs: ref.source_refs,
      })),
    ),
  ];

  const smokeDetails = WORKPLANE_BRIDGE_TRACE_DETAIL_SMOKE_REFS.map((smokeRef) => ({
    detail_id: `smoke:${smokeRef}`,
    ref_kind: "smoke" as const,
    source_panel_id: "source_ref_bridge",
    ref_id: smokeRef,
    summary: "Bridge/trace detail validation reference.",
    status: "candidate_check",
    notes: ["Validation refs are review signals, not proof/evidence records."],
    source_refs: [smokeRef],
  }));

  return dedupeDiagnosticDetails([
    ...currentDiagnostics,
    ...projectionDiagnostics,
    ...snapshots,
    ...smokeDetails,
    {
      detail_id: "docs:AGENT_WORKPLANE_BRIDGE_TRACE_DETAIL_V0_1.md",
      ref_kind: "docs",
      source_panel_id: "source_ref_bridge",
      ref_id: "docs/AGENT_WORKPLANE_BRIDGE_TRACE_DETAIL_V0_1.md",
      summary: "Bridge/trace detail hardening documentation.",
      status: "repo_local_doc",
      notes: ["Documentation is context, not shrink authority."],
      source_refs: ["docs/AGENT_WORKPLANE_BRIDGE_TRACE_DETAIL_V0_1.md"],
    },
    {
      detail_id: "repo:hynk-studio/augnes",
      ref_kind: "repo",
      source_panel_id: "source_ref_bridge",
      ref_id: "hynk-studio/augnes",
      summary: "Repository context for local Workplane bridge/trace review.",
      status: "repo_context",
      notes: ["Repository ref is not product execution authority."],
      source_refs: ["repo:hynk-studio/augnes"],
    },
  ]);
}

function buildGapDetails(
  context: WorkplaneContextRead,
): WorkplaneBridgeTraceGapDetail[] {
  const projectionGaps: WorkplaneBridgeTraceGapDetail[] =
    context.delta_projection_read.data.gaps.map((gap) => ({
      gap_id: `delta_projection:${gap.code}`,
      capability_id: "validation_smoke_visibility",
      status: gap.severity === "high" ? "needs_review" : "partial",
      summary: gap.summary,
      required_next_step: gap.details.join(" ") || "Review projected gap detail.",
      source_refs: gap.source_refs,
    }));

  return [
    {
      gap_id: "bridge_matrix_detail",
      capability_id: "bridge",
      status: "partial",
      summary:
        "Native Source Ref Bridge now exposes bridge rows and source ref kind classification, but full Cockpit Bridge matrix retirement still requires dogfood, metrics, browser regression, rollback, and human review.",
      required_next_step:
        "Use smoke:agent-workplane-bridge-trace-detail-v0-1 plus browser regression before any shrink candidate.",
      source_refs: [
        "docs/AGENT_WORKPLANE_NATIVE_ABSORPTION_MAP_V0_1.md",
        "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_PLAN_V0_1.md",
      ],
    },
    {
      gap_id: "source_backed_run_postmortem_fields",
      capability_id: "work_run_visibility",
      status: "needs_review",
      summary:
        "Run Postmortem remains a skeleton and still lacks source-backed fields for goal, decisions, validation, outputs, generated deltas, and unresolved issues.",
      required_next_step:
        "Implement source-backed Run Postmortem detail hardening in a later PR without runner execution.",
      source_refs: ["components/workplane/run-postmortem-skeleton-panel.tsx"],
    },
    {
      gap_id: "review_memory_proposal_visibility",
      capability_id: "review_memory_proposal_visibility",
      status: "needs_review",
      summary:
        "Review/memory proposal visibility remains only partially represented by Review Queue counts and needs a native candidate-detail panel before shrink review.",
      required_next_step:
        "Implement review/memory proposal native detail hardening before deleting compatibility content.",
      source_refs: [
        "docs/AGENT_WORKPLANE_COCKPIT_CAPABILITY_INVENTORY_V0_1.md",
      ],
    },
    ...projectionGaps,
  ];
}

function summarizeStatus({
  context,
  sourceRefs,
  bridgeRows,
  gapDetails,
}: {
  context: WorkplaneContextRead;
  sourceRefs: WorkplaneBridgeTraceDetailRef[];
  bridgeRows: WorkplaneBridgeTraceBridgeRow[];
  gapDetails: WorkplaneBridgeTraceGapDetail[];
}): WorkplaneBridgeTraceStatus {
  if (sourceRefs.length === 0) return "empty";
  if (
    context.source_status.current_perspective !== "runtime" ||
    context.source_status.delta_projection !== "runtime"
  ) {
    return "fallback";
  }
  if (bridgeRows.some((row) => row.status === "insufficient_data")) {
    return "insufficient_data";
  }
  if (gapDetails.some((gap) => gap.status === "needs_review")) {
    return "partial";
  }
  return "ready";
}

function rowStatus({
  rowId,
  context,
  hasRefs,
  nodeStatus,
}: {
  rowId: string;
  context: WorkplaneContextRead;
  hasRefs: boolean;
  nodeStatus?: string;
}): WorkplaneBridgeTraceStatus {
  if (!hasRefs) return "insufficient_data";
  if (rowId === "runner_delta_batch" && context.runner_delta_batch_read.status === "empty") {
    return "insufficient_data";
  }
  if (nodeStatus === "fallback" || context.source_status.delta_projection !== "runtime") {
    return "fallback";
  }
  if (nodeStatus === "ready") return "ready";
  return "partial";
}

function statusFromNodeStatus(status: string): WorkplaneBridgeTraceStatus {
  if (status === "ready") return "ready";
  if (status === "fallback" || status === "stale") return "fallback";
  if (status === "not_materialized") return "insufficient_data";
  return "partial";
}

function statusFromValidationStatus(status: string): WorkplaneBridgeTraceStatus {
  if (status === "passed") return "ready";
  if (status === "failed") return "needs_review";
  if (status === "skipped" || status === "not_run") return "insufficient_data";
  return "partial";
}

function buildFallbackNotes(context: WorkplaneContextRead) {
  return [
    context.fallback_reason.current_perspective,
    context.fallback_reason.delta_projection,
    context.fallback_reason.runner_delta_batch,
    ...context.runner_delta_batch_read.fallback_status.notes,
  ].filter((note): note is string => Boolean(note));
}

function buildStalenessNotes(context: WorkplaneContextRead) {
  return uniqueStrings([
    ...context.current_perspective_read.data.staleness.freshness_notes,
    ...context.runner_delta_batch_read.staleness.notes,
    `Current Perspective source status: ${context.source_status.current_perspective}.`,
    `Delta Projection source status: ${context.source_status.delta_projection}.`,
    `Runner DeltaBatch source status: ${context.source_status.runner_delta_batch}.`,
  ]);
}

function classifyRefKind(ref: string): WorkplaneBridgeTraceRefKind {
  if (ref.startsWith("current_perspective:")) return "current_perspective";
  if (ref.startsWith("delta_projection:") || ref.startsWith("delta:")) {
    return "delta_projection";
  }
  if (ref.startsWith("projected_delta_batch:")) return "projected_delta_batch";
  if (
    ref.startsWith("runner_delta_batch:") ||
    ref.startsWith("autonomy_run_delta_batch:")
  ) {
    return "runner_delta_batch";
  }
  if (ref.startsWith("work_event:") || ref.startsWith("work:")) return "work_event";
  if (ref.startsWith("coordination_event:")) return "coordination_event";
  if (ref.startsWith("action_record:")) return "action_record";
  if (ref.startsWith("evidence:") || ref.startsWith("evidence_record:")) {
    return "evidence";
  }
  if (ref.startsWith("artifact:")) return "artifact";
  if (ref.startsWith("handoff:")) return "handoff";
  if (ref.startsWith("diagnostic:")) return "diagnostic";
  if (ref.startsWith("snapshot:")) return "snapshot";
  if (ref.startsWith("smoke:")) return "smoke";
  if (ref.startsWith("docs:") || ref.startsWith("docs/")) return "docs";
  if (ref.startsWith("repo:")) return "repo";
  return "repo";
}

function labelForRef(ref: string) {
  const [prefix, value] = ref.split(":", 2);
  return value ? `${prefix}: ${value}` : ref;
}

function dedupeRefs(
  refs: WorkplaneBridgeTraceDetailRef[],
): WorkplaneBridgeTraceDetailRef[] {
  const seen = new Set<string>();
  return refs.filter((ref) => {
    const key = `${ref.ref_kind}:${ref.ref_id}:${ref.source_panel_id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function dedupeDiagnosticDetails(
  details: WorkplaneBridgeTraceDiagnosticDetail[],
) {
  const seen = new Set<string>();
  return details.filter((detail) => {
    if (seen.has(detail.detail_id)) return false;
    seen.add(detail.detail_id);
    return true;
  });
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((left, right) =>
    left.localeCompare(right),
  );
}

function chooseLatestTimestamp(left: string, right: string) {
  const leftParsed = Date.parse(left);
  const rightParsed = Date.parse(right);
  if (Number.isFinite(leftParsed) && Number.isFinite(rightParsed)) {
    return rightParsed > leftParsed ? right : left;
  }
  return left || right || new Date(0).toISOString();
}
